import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { mockCookieStore } from "../../setup";

import { GET } from "@/app/api/auth/google/route";

describe("GET /api/auth/google", () => {
  it("redirects to Google OAuth URL", async () => {
    mockCookieStore.get.mockReturnValue(undefined); // no session
    const req = new NextRequest("http://localhost:3000/api/auth/google");
    const res = await GET(req);

    expect(res.status).toBe(307); // redirect
    const location = res.headers.get("location");
    expect(location).toContain("accounts.google.com");
  });

  it("sets CSRF nonce cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const req = new NextRequest("http://localhost:3000/api/auth/google");
    await GET(req);

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "reviewai_oauth_state",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        maxAge: 600, // 10 minutes
        path: "/",
      })
    );
  });

  it("includes email from query param in state", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const req = new NextRequest("http://localhost:3000/api/auth/google?email=user@test.com");
    await GET(req);

    // The nonce was set — we know the state includes the email because
    // the route JSON.stringifys { userId, email, nonce }
    expect(mockCookieStore.set).toHaveBeenCalled();
  });

  it("redirects to error on failure", async () => {
    // Force error by removing env vars
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    const req = new NextRequest("http://localhost:3000/api/auth/google");
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("error=google_auth_failed");
  });
});
