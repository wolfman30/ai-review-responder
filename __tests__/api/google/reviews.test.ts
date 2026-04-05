import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, TEST_USER, TEST_REVIEW } from "../../setup";

vi.mock("@/app/lib/auth", async () => {
  const actual = await vi.importActual("@/app/lib/auth");
  return { ...actual, getCurrentUser: vi.fn() };
});

import { GET } from "@/app/api/google/reviews/route";
import { getCurrentUser } from "@/app/lib/auth";
const mockedGetCurrentUser = vi.mocked(getCurrentUser);

describe("GET /api/google/reviews", () => {
  it("returns all user reviews when no locationId", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, locations: [] } as any);
    mockPrisma.review.findMany.mockResolvedValue([TEST_REVIEW]);

    const req = new NextRequest("http://localhost:3000/api/google/reviews");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reviews).toHaveLength(1);
    expect(data.reviews[0].authorName).toBe("Jane Doe");
  });

  it("returns location-specific reviews when locationId provided", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, locations: [] } as any);
    mockPrisma.location.findFirst.mockResolvedValue({ id: "loc-123", userId: "user-123" });
    mockPrisma.review.findMany.mockResolvedValue([TEST_REVIEW]);

    const req = new NextRequest("http://localhost:3000/api/google/reviews?locationId=loc-123");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reviews).toHaveLength(1);
  });

  it("returns 404 when location not found", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, locations: [] } as any);
    mockPrisma.location.findFirst.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/google/reviews?locationId=nonexistent");
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/google/reviews");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("does NOT call Google API (DB only)", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, locations: [] } as any);
    mockPrisma.review.findMany.mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/google/reviews");
    await GET(req);

    // No fetch calls should be made (Google sync removed)
    const { mockFetch } = await import("../../setup");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 500 on unexpected error", async () => {
    mockedGetCurrentUser.mockRejectedValue(new Error("DB crash"));
    const req = new NextRequest("http://localhost:3000/api/google/reviews");
    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain("Failed to fetch reviews");
  });
});
