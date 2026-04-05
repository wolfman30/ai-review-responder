import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

/**
 * GET: Fetch reviews from the database.
 *
 * This endpoint only reads from DB. To sync new reviews from Google,
 * use POST /api/google/sync instead. This separation prevents the GET
 * from creating review records without AI drafts (which the sync
 * endpoint generates).
 *
 * Query params: locationId (optional — our DB id)
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

    // Return reviews from DB only — no Google sync here
    const reviews = await prisma.review.findMany({
      where: { locationId },
      include: {
        location: { select: { name: true, id: true } },
      },
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
