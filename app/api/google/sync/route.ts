import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import {
  getAuthenticatedClient,
  fetchReviews,
  parseStarRating,
} from "@/app/lib/google";
import { prisma } from "@/app/lib/db";
import { sendNewReviewAlert } from "@/app/lib/email";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Sync reviews for a single location: fetch from Google, create DB records,
 * generate AI drafts, send email alerts, and update location stats.
 *
 * Used by both the authenticated POST handler and the cron auto-sync.
 */
async function syncLocationReviews(
  userId: string,
  locationId: string,
  userEmail: string,
  alertsEnabled: boolean
): Promise<{ newReviewCount: number; totalReviews: number }> {
  const location = await prisma.location.findFirst({
    where: { id: locationId, userId },
  });
  if (!location) {
    throw new Error("Location not found");
  }

  const client = await getAuthenticatedClient(userId);
  if (!client || !client.credentials.access_token) {
    throw new Error("Google auth expired");
  }

  const googleLocationName = `accounts/${location.googleAccountId}/locations/${location.googleLocationId}`;
  const googleReviews = await fetchReviews(
    client.credentials.access_token,
    googleLocationName
  );

  let newReviewCount = 0;
  const newReviews: Array<{
    id: string;
    rating: number;
    text: string | null;
    authorName: string;
  }> = [];

  for (const gr of googleReviews) {
    const reviewId = gr.reviewId || gr.name.split("/").pop() || "";
    const existing = await prisma.review.findUnique({
      where: { googleReviewId: reviewId },
    });

    if (!existing) {
      const review = await prisma.review.create({
        data: {
          locationId: location.id,
          googleReviewId: reviewId,
          authorName: gr.reviewer.displayName || "Anonymous",
          authorPhotoUrl: gr.reviewer.profilePhotoUrl || null,
          rating: parseStarRating(gr.starRating),
          text: gr.comment || null,
          reviewDate: new Date(gr.createTime),
          status: gr.reviewReply ? "published" : "pending",
          finalResponse: gr.reviewReply?.comment || null,
          respondedAt: gr.reviewReply
            ? new Date(gr.reviewReply.updateTime)
            : null,
        },
      });

      if (!gr.reviewReply && gr.comment) {
        newReviews.push(review);
      }
      newReviewCount++;
    }
  }

  // Generate AI drafts for new unresponded reviews
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && newReviews.length > 0) {
    const anthropic = new Anthropic({ apiKey });

    for (const review of newReviews) {
      try {
        const message = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          system: `You are a professional business reputation manager. Write a response to this customer review on behalf of ${location.name}. Tone should be professional and warm. Response should be 2-4 sentences, genuine, not templated-sounding, and encourage the customer to return. Never make up specific details. Sign off with the business name.`,
          messages: [
            {
              role: "user",
              content: `${review.rating}-star review: ${review.text}`,
            },
          ],
        });

        const textBlock = message.content.find((b) => b.type === "text");
        if (textBlock && textBlock.type === "text") {
          await prisma.review.update({
            where: { id: review.id },
            data: {
              aiDraft: textBlock.text,
              status: "drafted",
            },
          });
        }
      } catch (aiErr) {
        console.error("AI draft generation error:", aiErr);
      }
    }
  }

  // Send email alerts for new reviews
  if (alertsEnabled && newReviews.length > 0) {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://reviewai.aiwolfsolutions.com";
    const dashboardUrl = `${appUrl}/app/dashboard`;

    for (const review of newReviews) {
      await sendNewReviewAlert({
        toEmail: userEmail,
        locationName: location.name,
        starRating: review.rating,
        authorName: review.authorName,
        reviewText: review.text,
        dashboardUrl,
      });
    }
  }

  // Update location stats
  const stats = await prisma.review.aggregate({
    where: { locationId: location.id },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.location.update({
    where: { id: location.id },
    data: {
      avgRating: stats._avg.rating || null,
      totalReviews: stats._count,
      lastSyncedAt: new Date(),
    },
  });

  return { newReviewCount, totalReviews: stats._count };
}

/**
 * POST: Sync reviews for a location and generate AI drafts for new reviews.
 * Body: { locationId }
 *
 * Authenticated via session cookie (dashboard usage).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { locationId } = await request.json();

    if (!user.googleRefreshToken) {
      return NextResponse.json(
        { error: "Google account not connected" },
        { status: 400 }
      );
    }

    const result = await syncLocationReviews(
      user.id,
      locationId,
      user.email,
      user.alertsEnabled
    );

    return NextResponse.json({
      synced: true,
      newReviews: result.newReviewCount,
      totalReviews: result.totalReviews,
    });
  } catch (err) {
    console.error("Sync error:", err);
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET: Cron-triggered sync for all monitored locations.
 * Authenticated via CRON_SECRET header (Vercel Cron or external scheduler).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all users with Google connected and monitored locations
    const users = await prisma.user.findMany({
      where: {
        googleRefreshToken: { not: null },
        locations: { some: { isMonitored: true } },
      },
      include: {
        locations: { where: { isMonitored: true } },
      },
    });

    let totalNew = 0;
    let locationsProcessed = 0;
    const errors: string[] = [];

    for (const user of users) {
      for (const location of user.locations) {
        try {
          const result = await syncLocationReviews(
            user.id,
            location.id,
            user.email,
            user.alertsEnabled
          );
          totalNew += result.newReviewCount;
          locationsProcessed++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`${location.name}: ${msg}`);
          console.error(`Cron sync error for location ${location.id}:`, err);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      locationsProcessed,
      newReviews: totalNew,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Cron sync error:", err);
    return NextResponse.json({ error: "Cron sync failed" }, { status: 500 });
  }
}
