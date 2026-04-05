import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/app/lib/google";
import { getCurrentUserId } from "@/app/lib/auth";

const OAUTH_STATE_COOKIE = "reviewai_oauth_state";

export async function GET(request: NextRequest) {
  try {
    // If user has a session, pass userId as state so we can link the Google account
    const userId = await getCurrentUserId();

    // Also accept email as query param for users coming from the connect flow
    const email = request.nextUrl.searchParams.get("email") || "";

    // Generate a random nonce for CSRF protection
    const nonce = crypto.randomUUID();

    const state = JSON.stringify({ userId, email, nonce });
    const url = getAuthUrl(state);

    // Set nonce cookie directly on the redirect response.
    // cookies().set() from next/headers doesn't attach to redirect responses.
    const response = NextResponse.redirect(url);
    response.cookies.set(OAUTH_STATE_COOKIE, nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes — OAuth flow should complete quickly
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(
      new URL("/app/dashboard?error=google_auth_failed", request.url)
    );
  }
}
