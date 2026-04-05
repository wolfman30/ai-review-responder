import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, mockAnthropicCreate, TEST_USER, TEST_REVIEW } from "../../setup";

vi.mock("@/app/lib/auth", async () => {
  const actual = await vi.importActual("@/app/lib/auth");
  return { ...actual, getCurrentUser: vi.fn() };
});

import { POST } from "@/app/api/reviews/draft/route";
import { getCurrentUser } from "@/app/lib/auth";
const mockedGetCurrentUser = vi.mocked(getCurrentUser);

function makeReq(body: unknown) {
  return new NextRequest("http://localhost:3000/api/reviews/draft", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/reviews/draft", () => {
  it("generates AI draft and updates review status", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, locations: [] } as any);
    mockPrisma.review.findFirst.mockResolvedValue(TEST_REVIEW);
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "Thank you for your wonderful review!" }],
    });
    mockPrisma.review.update.mockResolvedValue({ ...TEST_REVIEW, status: "drafted" });

    const res = await POST(makeReq({ reviewId: "rev-123" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.draft).toBe("Thank you for your wonderful review!");
    expect(mockPrisma.review.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          aiDraft: "Thank you for your wonderful review!",
          status: "drafted",
        }),
      })
    );
  });

  it("returns 401 when not authenticated", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);
    const res = await POST(makeReq({ reviewId: "rev-123" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when review not found", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, locations: [] } as any);
    mockPrisma.review.findFirst.mockResolvedValue(null);

    const res = await POST(makeReq({ reviewId: "nonexistent" }));
    expect(res.status).toBe(404);
  });

  it("returns 500 when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, locations: [] } as any);
    mockPrisma.review.findFirst.mockResolvedValue(TEST_REVIEW);

    const res = await POST(makeReq({ reviewId: "rev-123" }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when AI API fails", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, locations: [] } as any);
    mockPrisma.review.findFirst.mockResolvedValue(TEST_REVIEW);
    mockAnthropicCreate.mockRejectedValue(new Error("AI down"));

    const res = await POST(makeReq({ reviewId: "rev-123" }));
    expect(res.status).toBe(500);
  });

  it("uses custom tone when provided", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, locations: [] } as any);
    mockPrisma.review.findFirst.mockResolvedValue(TEST_REVIEW);
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "Casual response" }],
    });
    mockPrisma.review.update.mockResolvedValue({});

    await POST(makeReq({ reviewId: "rev-123", tone: "Casual and fun" }));

    expect(mockAnthropicCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Casual and fun"),
      })
    );
  });
});
