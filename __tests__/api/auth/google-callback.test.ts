import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { mockCookieStore, mockPrisma, mockFetch, mockOAuth2Client, TEST_USER } from "../../setup";

import { GET } from "@/app/api/auth/google/callback/route";

const nonce = "test-nonce-123";

function makeCallbackReq(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/auth/google/callback");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

describe("GET /api/auth/google/callback", () => {
  it("completes OAuth flow with valid nonce", async () => {
    const state = JSON.stringify({ userId: null, email: "", nonce });
    mockCookieStore.get.mockReturnValue({ value: nonce });
    mockOAuth2Client.getToken.mockResolvedValue({
      tokens: { access_token: "tok", refresh_token: "rtok", expiry_date: Date.now() + 3600000 },
    });
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ email: "user@google.com" }),
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ ...TEST_USER, email: "user@google.com" });
    mockPrisma.user.update.mockResolvedValue(TEST_USER);

    const res = await GET(makeCallbackReq({ code: "auth-code", state }));

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/app/dashboard?connected=true");
    // Session cookie is set directly on the redirect response
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("reviewai_session");
  });

  it("rejects when nonce cookie is missing", async () => {
    const state = JSON.stringify({ nonce: "some-nonce" });
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await GET(makeCallbackReq({ code: "auth-code", state }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=invalid_state");
  });

  it("rejects when nonce does not match", async () => {
    const state = JSON.stringify({ nonce: "wrong-nonce" });
    mockCookieStore.get.mockReturnValue({ value: "correct-nonce" });

    const res = await GET(makeCallbackReq({ code: "auth-code", state }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=invalid_state");
  });

  it("clears nonce cookie even on mismatch", async () => {
    const state = JSON.stringify({ nonce: "wrong" });
    mockCookieStore.get.mockReturnValue({ value: "correct" });

    await GET(makeCallbackReq({ code: "auth-code", state }));
    expect(mockCookieStore.delete).toHaveBeenCalledWith("reviewai_oauth_state");
  });

  it("redirects to error when Google returns error param", async () => {
    const res = await GET(makeCallbackReq({ error: "access_denied" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=google_denied");
  });

  it("redirects to error when no code param", async () => {
    const res = await GET(makeCallbackReq({}));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=no_code");
  });

  it("redirects to error when token exchange fails", async () => {
    const state = JSON.stringify({ nonce });
    mockCookieStore.get.mockReturnValue({ value: nonce });
    mockOAuth2Client.getToken.mockRejectedValue(new Error("Token exchange failed"));

    const res = await GET(makeCallbackReq({ code: "bad-code", state }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=token_exchange_failed");
  });

  it("stores Google tokens in user record", async () => {
    const state = JSON.stringify({ email: "existing@test.com", nonce });
    mockCookieStore.get.mockReturnValue({ value: nonce });
    mockOAuth2Client.getToken.mockResolvedValue({
      tokens: { access_token: "at", refresh_token: "rt", expiry_date: 9999999 },
    });
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ email: "google@test.com" }),
    });
    mockPrisma.user.findUnique.mockResolvedValue(TEST_USER);
    mockPrisma.user.update.mockResolvedValue(TEST_USER);

    await GET(makeCallbackReq({ code: "code", state }));

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          googleAccessToken: "at",
          googleRefreshToken: "rt",
        }),
      })
    );
  });
});
