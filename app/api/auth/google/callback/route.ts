import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client } from "@/app/lib/google";
import { findOrCreateUser, setSessionCookie } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateStr = request.nextUrl.searchParams.get("state") || "{}";
  const error = request.nextUrl.searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    console.error("Google OAuth denied:", error);
    return NextResponse.redirect(
      `${baseUrl}/app/dashboard?error=google_denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/app/dashboard?error=no_code`
    );
  }

  try {
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user's email from Google
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );
    const userInfo = await userInfoRes.json();
    const googleEmail = userInfo.email as string;

    // Parse state to see if we have an existing user/email
    let state: { userId?: string; email?: string } = {};
    try {
      state = JSON.parse(stateStr);
    } catch {
      // ignore parse errors
    }

    const email = state.email || googleEmail;

    // Find or create user
    const user = await findOrCreateUser(email);

    // Store Google tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        googleAccessToken: tokens.access_token || null,
        googleRefreshToken: tokens.refresh_token || null,
        googleTokenExpiry: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
      },
    });

    // Set session cookie
    await setSessionCookie(user.id);

    // Redirect to dashboard
    return NextResponse.redirect(
      `${baseUrl}/app/dashboard?connected=true`
    );
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/app/dashboard?error=token_exchange_failed`
    );
  }
}
