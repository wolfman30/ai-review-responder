import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import { getAuthenticatedClient, replyToReview } from "@/app/lib/google";
import { prisma } from "@/app/lib/db";

/**
 * POST: Publish a response to a Google review.
 * Body: { reviewId, response }
 * - reviewId: our DB review ID
 * - response: the text to publish (can be AI draft or edited)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.tier === "free") {
      return NextResponse.json(
        { error: "Publishing responses requires a Pro or Business plan" },
        { status: 403 }
      );
    }

    const { reviewId, response } = await request.json();

    if (!reviewId || !response) {
      return NextResponse.json(
        { error: "reviewId and response are required" },
        { status: 400 }
      );
    }

    // Get the review and verify ownership
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        location: { userId: user.id },
      },
      include: {
        location: true,
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Publish to Google — must succeed before we mark as published
    if (!user.googleRefreshToken) {
      return NextResponse.json(
        { error: "Google account not connected. Please reconnect your Google Business Profile." },
        { status: 400 }
      );
    }

    const client = await getAuthenticatedClient(user.id);
    if (!client || !client.credentials.access_token) {
      return NextResponse.json(
        { error: "Failed to get Google credentials. Please reconnect your Google Business Profile." },
        { status: 400 }
      );
    }

    const googleReviewName = `accounts/${review.location.googleAccountId}/locations/${review.location.googleLocationId}/reviews/${review.googleReviewId}`;
    await replyToReview(
      client.credentials.access_token,
      googleReviewName,
      response
    );

    // Only update DB after successful Google publish
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        finalResponse: response,
        respondedAt: new Date(),
        status: "published",
      },
    });

    return NextResponse.json({ published: true });
  } catch (err) {
    console.error("Reply error:", err);
    return NextResponse.json(
      { error: "Failed to publish response" },
      { status: 500 }
    );
  }
}
