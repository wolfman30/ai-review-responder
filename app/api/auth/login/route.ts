import { NextResponse } from "next/server";

/**
 * Email-only login is disabled — use Google OAuth at /api/auth/google.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Email login is disabled. Please sign in with Google." },
    { status: 410 }
  );
}
