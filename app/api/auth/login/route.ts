import { NextRequest, NextResponse } from "next/server";
import { findOrCreateUser, setSessionCookie } from "@/app/lib/auth";

/**
 * Simple email-based login. Creates user if not exists, sets session cookie.
 * No password — this is MVP auth. Google OAuth is the primary flow.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    const user = await findOrCreateUser(email);
    await setSessionCookie(user.id);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      tier: user.tier,
      hasGoogle: !!user.googleRefreshToken,
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
