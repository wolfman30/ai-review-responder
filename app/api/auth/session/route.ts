import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        tier: user.tier,
        hasGoogle: !!user.googleRefreshToken,
        locationCount: user.locations.length,
      },
    });
  } catch (err) {
    console.error("Session check error:", err);
    return NextResponse.json({ user: null });
  }
}
