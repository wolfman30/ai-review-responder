import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, mockAnthropicCreate, mockSESSend, mockFetch, TEST_USER, TEST_LOCATION } from "../../setup";

vi.mock("@/app/lib/auth", async () => {
  const actual = await vi.importActual("@/app/lib/auth");
  return { ...actual, getCurrentUser: vi.fn() };
});
vi.mock("@/app/lib/google", async () => {
  const actual = await vi.importActual("@/app/lib/google");
  return {
    ...actual,
    getAuthenticatedClient: vi.fn(),
    fetchReviews: vi.fn(),
  };
});

import { POST, GET } from "@/app/api/google/sync/route";
import { getCurrentUser } from "@/app/lib/auth";
import { getAuthenticatedClient, fetchReviews } from "@/app/lib/google";

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedGetAuthClient = vi.mocked(getAuthenticatedClient);
const mockedFetchReviews = vi.mocked(fetchReviews);

function makePostReq(body: unknown) {
  return new NextRequest("http://localhost:3000/api/google/sync", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeCronReq(secret?: string) {
  const headers: Record<string, string> = {};
  if (secret) headers["authorization"] = `Bearer ${secret}`;
  return new NextRequest("http://localhost:3000/api/google/sync", { headers });
}

describe("POST /api/google/sync", () => {
  it("syncs new reviews and generates AI drafts", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      ...TEST_USER,
      locations: [TEST_LOCATION],
    } as any);
    mockPrisma.location.findFirst.mockResolvedValue(TEST_LOCATION);
    mockedGetAuthClient.mockResolvedValue({
      credentials: { access_token: "tok" },
    } as any);
    mockedFetchReviews.mockResolvedValue([
      {
        name: "accounts/1/locations/2/reviews/new-1",
        reviewId: "new-1",
        reviewer: { displayName: "New Reviewer" },
        starRating: "FOUR",
        comment: "Very good!",
        createTime: "2026-01-01T00:00:00Z",
        updateTime: "2026-01-01T00:00:00Z",
      },
    ] as any);
    // Batch fetch existing — none exist
    mockPrisma.review.findMany.mockResolvedValue([]);
    mockPrisma.review.create.mockResolvedValue({
      id: "rev-new",
      rating: 4,
      text: "Very good!",
      authorName: "New Reviewer",
    });
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "Thank you for the review!" }],
    });
    mockPrisma.review.update.mockResolvedValue({});
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.5 }, _count: 11 });
    mockPrisma.location.update.mockResolvedValue({});

    const res = await POST(makePostReq({ locationId: "loc-123" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.synced).toBe(true);
    expect(data.newReviews).toBe(1);
    // AI draft was generated
    expect(mockAnthropicCreate).toHaveBeenCalled();
    // Email alert was sent
    expect(mockSESSend).toHaveBeenCalled();
  });

  it("skips existing reviews (batch ID check)", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, locations: [TEST_LOCATION] } as any);
    mockPrisma.location.findFirst.mockResolvedValue(TEST_LOCATION);
    mockedGetAuthClient.mockResolvedValue({ credentials: { access_token: "tok" } } as any);
    mockedFetchReviews.mockResolvedValue([
      { name: "r/1", reviewId: "existing-1", reviewer: { displayName: "A" }, starRating: "FIVE", comment: "Great", createTime: "2026-01-01T00:00:00Z", updateTime: "2026-01-01T00:00:00Z" },
    ] as any);
    // Already exists in batch
    mockPrisma.review.findMany.mockResolvedValue([{ googleReviewId: "existing-1" }]);
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 5 }, _count: 1 });
    mockPrisma.location.update.mockResolvedValue({});

    const res = await POST(makePostReq({ locationId: "loc-123" }));
    const data = await res.json();

    expect(data.newReviews).toBe(0);
    expect(mockPrisma.review.create).not.toHaveBeenCalled();
  });

  it("returns 401 when not authenticated", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);
    const res = await POST(makePostReq({ locationId: "loc-123" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when no Google connection", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      ...TEST_USER,
      googleRefreshToken: null,
      locations: [],
    } as any);
    const res = await POST(makePostReq({ locationId: "loc-123" }));
    expect(res.status).toBe(400);
  });

  it("returns 500 when location not found", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, locations: [TEST_LOCATION] } as any);
    mockPrisma.location.findFirst.mockResolvedValue(null);

    const res = await POST(makePostReq({ locationId: "bad-id" }));
    expect(res.status).toBe(500);
  });

  it("handles reviews with existing replies (no draft generated)", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, locations: [TEST_LOCATION] } as any);
    mockPrisma.location.findFirst.mockResolvedValue(TEST_LOCATION);
    mockedGetAuthClient.mockResolvedValue({ credentials: { access_token: "tok" } } as any);
    mockedFetchReviews.mockResolvedValue([
      {
        name: "r/1", reviewId: "replied-1", reviewer: { displayName: "A" },
        starRating: "FIVE", comment: "Great", createTime: "2026-01-01T00:00:00Z",
        updateTime: "2026-01-01T00:00:00Z",
        reviewReply: { comment: "Thanks!", updateTime: "2026-01-02T00:00:00Z" },
      },
    ] as any);
    mockPrisma.review.findMany.mockResolvedValue([]);
    mockPrisma.review.create.mockResolvedValue({ id: "r1", rating: 5, text: "Great", authorName: "A" });
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 5 }, _count: 1 });
    mockPrisma.location.update.mockResolvedValue({});

    const res = await POST(makePostReq({ locationId: "loc-123" }));
    const data = await res.json();

    expect(data.newReviews).toBe(1);
    // No AI draft should be generated for already-replied reviews
    expect(mockAnthropicCreate).not.toHaveBeenCalled();
  });

  it("skips email alerts when disabled", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      ...TEST_USER, alertsEnabled: false, locations: [TEST_LOCATION],
    } as any);
    mockPrisma.location.findFirst.mockResolvedValue(TEST_LOCATION);
    mockedGetAuthClient.mockResolvedValue({ credentials: { access_token: "tok" } } as any);
    mockedFetchReviews.mockResolvedValue([
      { name: "r/1", reviewId: "new-2", reviewer: { displayName: "B" }, starRating: "FOUR", comment: "Nice", createTime: "2026-01-01T00:00:00Z", updateTime: "2026-01-01T00:00:00Z" },
    ] as any);
    mockPrisma.review.findMany.mockResolvedValue([]);
    mockPrisma.review.create.mockResolvedValue({ id: "r2", rating: 4, text: "Nice", authorName: "B" });
    mockAnthropicCreate.mockResolvedValue({ content: [{ type: "text", text: "Thanks" }] });
    mockPrisma.review.update.mockResolvedValue({});
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4 }, _count: 1 });
    mockPrisma.location.update.mockResolvedValue({});

    await POST(makePostReq({ locationId: "loc-123" }));
    expect(mockSESSend).not.toHaveBeenCalled();
  });

  it("handles reviews with no comment (no AI draft)", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, locations: [TEST_LOCATION] } as any);
    mockPrisma.location.findFirst.mockResolvedValue(TEST_LOCATION);
    mockedGetAuthClient.mockResolvedValue({ credentials: { access_token: "tok" } } as any);
    mockedFetchReviews.mockResolvedValue([
      { name: "r/1", reviewId: "nocomment-1", reviewer: { displayName: "C" }, starRating: "THREE", createTime: "2026-01-01T00:00:00Z", updateTime: "2026-01-01T00:00:00Z" },
    ] as any);
    mockPrisma.review.findMany.mockResolvedValue([]);
    mockPrisma.review.create.mockResolvedValue({ id: "r3", rating: 3, text: null, authorName: "C" });
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 3 }, _count: 1 });
    mockPrisma.location.update.mockResolvedValue({});

    await POST(makePostReq({ locationId: "loc-123" }));
    // No AI draft for reviews without text
    expect(mockAnthropicCreate).not.toHaveBeenCalled();
  });
});

describe("GET /api/google/sync (cron)", () => {
  it("returns 401 when no auth header", async () => {
    const res = await GET(makeCronReq());
    expect(res.status).toBe(401);
  });

  it("returns 401 when wrong secret", async () => {
    const res = await GET(makeCronReq("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("returns 401 when CRON_SECRET not set", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(makeCronReq("any-secret"));
    expect(res.status).toBe(401);
  });

  it("processes all monitored locations", async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { ...TEST_USER, locations: [TEST_LOCATION] },
    ]);
    mockPrisma.location.findFirst.mockResolvedValue(TEST_LOCATION);
    mockedGetAuthClient.mockResolvedValue({ credentials: { access_token: "tok" } } as any);
    mockedFetchReviews.mockResolvedValue([]);
    mockPrisma.review.findMany.mockResolvedValue([]);
    mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.5 }, _count: 0 });
    mockPrisma.location.update.mockResolvedValue({});

    const res = await GET(makeCronReq("test-cron-secret"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.locationsProcessed).toBe(1);
  });

  it("reports per-location errors", async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { ...TEST_USER, locations: [TEST_LOCATION] },
    ]);
    mockPrisma.location.findFirst.mockResolvedValue(null); // will cause "Location not found"

    const res = await GET(makeCronReq("test-cron-secret"));
    const data = await res.json();

    expect(data.ok).toBe(true);
    expect(data.errors).toBeDefined();
    expect(data.errors.length).toBeGreaterThan(0);
    expect(data.errors[0]).toContain("Location not found");
  });

  it("returns 500 on top-level failure", async () => {
    mockPrisma.user.findMany.mockRejectedValue(new Error("DB crashed"));

    const res = await GET(makeCronReq("test-cron-secret"));
    expect(res.status).toBe(500);
  });
});
