import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/app/lib/google";
import { getCurrentUserId } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // If user has a session, pass userId as state so we can link the Google account
    const userId = await getCurrentUserId();

    // Also accept email as query param for users coming from the connect flow
    const email = request.nextUrl.searchParams.get("email") || "";

    const state = JSON.stringify({ userId, email });
    const url = getAuthUrl(state);

    return NextResponse.redirect(url);
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(
      new URL("/app/dashboard?error=google_auth_failed", request.url)
    );
  }
}
