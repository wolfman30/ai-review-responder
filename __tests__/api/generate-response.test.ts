import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, mockCookieStore, mockAnthropicCreate } from "../setup";

import { POST } from "@/app/api/generate-response/route";

function makeReq(body: unknown, headers: Record<string, string> = {}) {
  const req = new NextRequest("http://localhost:3000/api/generate-response", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
  });
  return req;
}

const validBody = {
  review: "Great place!",
  businessName: "Test Biz",
  businessType: "Restaurant",
  tone: "Professional",
};

describe("POST /api/generate-response", () => {
  it("returns AI response for valid input", async () => {
    // Anonymous user with low count
    mockCookieStore.get.mockReturnValue({ value: "anon_test-uuid" });
    mockPrisma.user.upsert.mockResolvedValue({ responseCount: 0, responseCountResetAt: new Date() });
    mockPrisma.user.update.mockResolvedValue({ responseCount: 1 });
    mockAnthropicCreate.mockResolvedValue({ content: [{ type: "text", text: "Thank you!" }] });

    const res = await POST(makeReq(validBody));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.response).toBe("Thank you!");
  });

  it("returns 400 when fields are missing", async () => {
    const res = await POST(makeReq({ review: "hello" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Missing required fields");
  });

  it("returns 400 when review is empty", async () => {
    const res = await POST(makeReq({ ...validBody, review: "" }));
    expect(res.status).toBe(400);
  });

  it("bypasses rate limit for pro users", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ tier: "pro" });
    mockAnthropicCreate.mockResolvedValue({ content: [{ type: "text", text: "Pro response" }] });

    const res = await POST(makeReq(validBody, { "X-User-Email": "pro@test.com" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.response).toBe("Pro response");
    // Should NOT have called upsert (no rate limit check)
    expect(mockPrisma.user.upsert).not.toHaveBeenCalled();
  });

  it("enforces rate limit for anonymous users via cookie", async () => {
    mockCookieStore.get.mockReturnValue({ value: "anon_existing" });
    mockPrisma.user.upsert.mockResolvedValue({ responseCount: 5, responseCountResetAt: new Date() });
    // After atomic increment, count is 6 which exceeds limit
    mockPrisma.user.update.mockResolvedValueOnce({ responseCount: 6 });
    // Decrement call
    mockPrisma.user.update.mockResolvedValueOnce({ responseCount: 5 });

    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain("Free limit reached");
  });

  it("enforces rate limit for email users", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ tier: "free" });
    mockPrisma.user.upsert.mockResolvedValue({ responseCount: 5, responseCountResetAt: new Date() });
    mockPrisma.user.update.mockResolvedValueOnce({ responseCount: 6 });
    mockPrisma.user.update.mockResolvedValueOnce({ responseCount: 5 });

    const res = await POST(makeReq(validBody, { "X-User-Email": "free@test.com" }));
    expect(res.status).toBe(429);
  });

  it("resets count on month rollover", async () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    mockCookieStore.get.mockReturnValue({ value: "anon_test" });
    mockPrisma.user.upsert.mockResolvedValue({ responseCount: 5, responseCountResetAt: lastMonth });
    // Reset call
    mockPrisma.user.update.mockResolvedValueOnce({ responseCount: 0 });
    // Atomic increment
    mockPrisma.user.update.mockResolvedValueOnce({ responseCount: 1 });
    mockAnthropicCreate.mockResolvedValue({ content: [{ type: "text", text: "Fresh month!" }] });

    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
  });

  it("refunds rate limit slot on AI API failure", async () => {
    mockCookieStore.get.mockReturnValue({ value: "anon_test" });
    mockPrisma.user.upsert.mockResolvedValue({ responseCount: 0, responseCountResetAt: new Date() });
    mockPrisma.user.update.mockResolvedValue({ responseCount: 1 });
    mockAnthropicCreate.mockRejectedValue(new Error("API down"));

    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(500);

    // Verify decrement was called (refund)
    const decrementCalls = mockPrisma.user.update.mock.calls.filter(
      (call: unknown[]) => {
        const arg = call[0] as { data?: { responseCount?: { decrement?: number } } };
        return arg?.data?.responseCount?.decrement === 1;
      }
    );
    expect(decrementCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("returns 500 when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    mockCookieStore.get.mockReturnValue({ value: "anon_test" });
    mockPrisma.user.upsert.mockResolvedValue({ responseCount: 0, responseCountResetAt: new Date() });
    mockPrisma.user.update.mockResolvedValue({ responseCount: 1 });

    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain("Server configuration error");
  });

  it("creates anon cookie when none exists", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    mockPrisma.user.upsert.mockResolvedValue({ responseCount: 0, responseCountResetAt: new Date() });
    mockPrisma.user.update.mockResolvedValue({ responseCount: 1 });
    mockAnthropicCreate.mockResolvedValue({ content: [{ type: "text", text: "Hi" }] });

    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "reviewai_anon_id",
      expect.stringContaining("anon_"),
      expect.objectContaining({ httpOnly: true })
    );
  });
});
