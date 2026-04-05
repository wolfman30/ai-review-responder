import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client } from "@/app/lib/google";
import { findOrCreateUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { cookies } from "next/headers";

const OAUTH_STATE_COOKIE = "reviewai_oauth_state";

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

  // Verify CSRF nonce from cookie matches state parameter
  const cookieStore = await cookies();
  const storedNonce = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  // Clear the cookie regardless of outcome
  cookieStore.delete(OAUTH_STATE_COOKIE);

  let state: { userId?: string; email?: string; nonce?: string } = {};
  try {
    state = JSON.parse(stateStr);
  } catch {
    // ignore parse errors
  }

  if (!storedNonce || !state.nonce || storedNonce !== state.nonce) {
    console.error(`[oauth-callback] CSRF failed: storedNonce=${storedNonce ? "present" : "MISSING"}, stateNonce=${state.nonce ? "present" : "MISSING"}, match=${storedNonce === state.nonce}`);
    return NextResponse.redirect(
      `${baseUrl}/app/dashboard?error=invalid_state`
    );
  }
  console.log("[oauth-callback] CSRF nonce verified OK");

  try {
    console.log("[oauth-callback] Step 1: exchanging code for tokens");
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    console.log("[oauth-callback] Step 2: tokens received, fetching userinfo");

    // Get user's email from Google
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );
    const userInfo = await userInfoRes.json();
    const googleEmail = userInfo.email as string;
    console.log("[oauth-callback] Step 3: got email", googleEmail);

    const email = state.email || googleEmail;

    // Find or create user
    const user = await findOrCreateUser(email);
    console.log("[oauth-callback] Step 4: user found/created", user.id);

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
    console.log("[oauth-callback] Step 5: tokens stored, redirecting to dashboard");

    // Set session cookie on the redirect response directly.
    // Using cookies().set() inside a redirect doesn't reliably attach
    // the Set-Cookie header in Next.js — we must set it on the response.
    const redirectUrl = `${baseUrl}/app/dashboard?connected=true`;
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("reviewai_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return response;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : "";
    console.error(`[oauth-callback] FAILED: ${errMsg}`);
    console.error(`[oauth-callback] Stack: ${errStack}`);
    return NextResponse.redirect(
      `${baseUrl}/app/dashboard?error=token_exchange_failed`
    );
  }
}
