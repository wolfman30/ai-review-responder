import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, mockCookieStore, mockFetch, TEST_USER, TEST_REVIEW } from "../../setup";

// Mock auth module directly since reply route uses getCurrentUser
vi.mock("@/app/lib/auth", async () => {
  const actual = await vi.importActual("@/app/lib/auth");
  return {
    ...actual,
    getCurrentUser: vi.fn(),
  };
});

// Mock google lib
vi.mock("@/app/lib/google", async () => {
  const actual = await vi.importActual("@/app/lib/google");
  return {
    ...actual,
    getAuthenticatedClient: vi.fn(),
    replyToReview: vi.fn(),
  };
});

import { POST } from "@/app/api/google/reply/route";
import { getCurrentUser } from "@/app/lib/auth";
import { getAuthenticatedClient, replyToReview } from "@/app/lib/google";
import { vi } from "vitest";

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedGetAuthClient = vi.mocked(getAuthenticatedClient);
const mockedReplyToReview = vi.mocked(replyToReview);

function makeReq(body: unknown) {
  return new NextRequest("http://localhost:3000/api/google/reply", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/google/reply", () => {
  it("publishes response to Google then updates DB", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, tier: "pro", locations: [] } as any);
    mockPrisma.review.findFirst.mockResolvedValue(TEST_REVIEW);
    mockedGetAuthClient.mockResolvedValue({
      credentials: { access_token: "tok" },
    } as any);
    mockedReplyToReview.mockResolvedValue(undefined);
    mockPrisma.review.update.mockResolvedValue({ ...TEST_REVIEW, status: "published" });

    const res = await POST(makeReq({ reviewId: "rev-123", response: "Thanks!" }));
    expect(res.status).toBe(200);

    // Verify Google called before DB
    expect(mockedReplyToReview).toHaveBeenCalledBefore(mockPrisma.review.update);
    expect(mockPrisma.review.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "published", finalResponse: "Thanks!" }),
      })
    );
  });

  it("returns 401 when not authenticated", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);
    const res = await POST(makeReq({ reviewId: "rev-123", response: "Hi" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 for free tier", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, tier: "free", locations: [] } as any);
    const res = await POST(makeReq({ reviewId: "rev-123", response: "Hi" }));
    expect(res.status).toBe(403);
  });

  it("returns 404 when review not found", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, tier: "pro", locations: [] } as any);
    mockPrisma.review.findFirst.mockResolvedValue(null);

    const res = await POST(makeReq({ reviewId: "nonexistent", response: "Hi" }));
    expect(res.status).toBe(404);
  });

  it("returns 400 when missing reviewId or response", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, tier: "pro", locations: [] } as any);
    const res = await POST(makeReq({ reviewId: "rev-123" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when no Google refresh token", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      ...TEST_USER,
      tier: "pro",
      googleRefreshToken: null,
      locations: [],
    } as any);
    mockPrisma.review.findFirst.mockResolvedValue(TEST_REVIEW);

    const res = await POST(makeReq({ reviewId: "rev-123", response: "Hi" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when Google auth client returns null", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, tier: "pro", locations: [] } as any);
    mockPrisma.review.findFirst.mockResolvedValue(TEST_REVIEW);
    mockedGetAuthClient.mockResolvedValue(null);

    const res = await POST(makeReq({ reviewId: "rev-123", response: "Hi" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Google credentials");
  });

  it("returns 400 when access token is missing", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, tier: "pro", locations: [] } as any);
    mockPrisma.review.findFirst.mockResolvedValue(TEST_REVIEW);
    mockedGetAuthClient.mockResolvedValue({ credentials: { access_token: null } } as any);

    const res = await POST(makeReq({ reviewId: "rev-123", response: "Hi" }));
    expect(res.status).toBe(400);
  });

  it("returns 500 when Google API fails", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, tier: "pro", locations: [] } as any);
    mockPrisma.review.findFirst.mockResolvedValue(TEST_REVIEW);
    mockedGetAuthClient.mockResolvedValue({
      credentials: { access_token: "tok" },
    } as any);
    mockedReplyToReview.mockRejectedValue(new Error("Google API error"));

    const res = await POST(makeReq({ reviewId: "rev-123", response: "Hi" }));
    expect(res.status).toBe(500);
    // DB should NOT be updated on Google failure
    expect(mockPrisma.review.update).not.toHaveBeenCalled();
  });
});
