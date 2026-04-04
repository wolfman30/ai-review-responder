import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import { getAuthenticatedClient, fetchReviews, parseStarRating } from "@/app/lib/google";
import { prisma } from "@/app/lib/db";

/**
 * GET: Fetch reviews for a location. Syncs new ones to DB.
 * Query params: locationId (our DB id)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const locationId = request.nextUrl.searchParams.get("locationId");

    // If no locationId, return all reviews for all user locations
    if (!locationId) {
      const reviews = await prisma.review.findMany({
        where: {
          location: { userId: user.id },
        },
        include: {
          location: { select: { name: true, id: true } },
        },
        orderBy: { reviewDate: "desc" },
        take: 100,
      });
      return NextResponse.json({ reviews });
    }

    // Verify location belongs to user
    const location = await prisma.location.findFirst({
      where: { id: locationId, userId: user.id },
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // If Google is connected, sync reviews from Google
    if (user.googleRefreshToken) {
      const client = await getAuthenticatedClient(user.id);
      if (client && client.credentials.access_token) {
        try {
          const googleLocationName = `accounts/${location.googleAccountId}/locations/${location.googleLocationId}`;
          const googleReviews = await fetchReviews(
            client.credentials.access_token,
            googleLocationName
          );

          // Sync to DB
          for (const gr of googleReviews) {
            const reviewId = gr.reviewId || gr.name.split("/").pop() || "";
            await prisma.review.upsert({
              where: { googleReviewId: reviewId },
              update: {
                text: gr.comment || null,
                rating: parseStarRating(gr.starRating),
              },
              create: {
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
        } catch (syncErr) {
          console.error("Review sync error:", syncErr);
          // Still return what we have in DB
        }
      }
    }

    // Return reviews from DB
    const reviews = await prisma.review.findMany({
      where: { locationId },
      orderBy: { reviewDate: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (err) {
    console.error("Fetch reviews error:", err);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
