import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { mockStripeCheckoutRetrieve } from "../setup";

import { GET } from "@/app/api/verify-session/route";

function makeReq(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/verify-session");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

describe("GET /api/verify-session", () => {
  it("returns isPro and email for paid session", async () => {
    mockStripeCheckoutRetrieve.mockResolvedValue({
      payment_status: "paid",
      customer_email: "user@test.com",
      customer_details: { email: "user@test.com" },
    });

    const res = await GET(makeReq({ session_id: "cs_123" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.isPro).toBe(true);
    expect(data.email).toBe("user@test.com");
  });

  it("returns 402 when payment not completed", async () => {
    mockStripeCheckoutRetrieve.mockResolvedValue({
      payment_status: "unpaid",
      customer_email: "user@test.com",
    });

    const res = await GET(makeReq({ session_id: "cs_123" }));
    expect(res.status).toBe(402);
  });

  it("returns 400 when session_id is missing", async () => {
    const res = await GET(makeReq({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Missing session_id");
  });

  it("returns 500 when STRIPE_SECRET_KEY is missing", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await GET(makeReq({ session_id: "cs_123" }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when Stripe API fails", async () => {
    mockStripeCheckoutRetrieve.mockRejectedValue(new Error("Stripe down"));
    const res = await GET(makeReq({ session_id: "cs_123" }));
    expect(res.status).toBe(500);
  });

  it("returns 400 when paid but no email found", async () => {
    mockStripeCheckoutRetrieve.mockResolvedValue({
      payment_status: "paid",
      customer_email: null,
      customer_details: { email: null },
    });

    const res = await GET(makeReq({ session_id: "cs_123" }));
    expect(res.status).toBe(400);
  });

  it("falls back to customer_details.email", async () => {
    mockStripeCheckoutRetrieve.mockResolvedValue({
      payment_status: "paid",
      customer_email: null,
      customer_details: { email: "fallback@test.com" },
    });

    const res = await GET(makeReq({ session_id: "cs_123" }));
    const data = await res.json();
    expect(data.email).toBe("fallback@test.com");
  });
});
