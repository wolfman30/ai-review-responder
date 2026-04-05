import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { mockStripeCheckoutCreate } from "../setup";

import { POST } from "@/app/api/create-checkout-session/route";

function makeReq(body: unknown) {
  return new NextRequest("http://localhost:3000/api/create-checkout-session", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/create-checkout-session", () => {
  it("creates pro checkout session at $49", async () => {
    mockStripeCheckoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/pro" });

    const res = await POST(makeReq({ email: "test@test.com", tier: "pro" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.url).toBe("https://checkout.stripe.com/pro");
    expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        metadata: { tier: "pro" },
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({ unit_amount: 4900 }),
          }),
        ]),
      })
    );
  });

  it("creates business checkout session at $99", async () => {
    mockStripeCheckoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/biz" });

    const res = await POST(makeReq({ tier: "business" }));
    const data = await res.json();

    expect(data.url).toBe("https://checkout.stripe.com/biz");
    expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { tier: "business" },
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({ unit_amount: 9900 }),
          }),
        ]),
      })
    );
  });

  it("defaults to pro when no tier specified", async () => {
    mockStripeCheckoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/default" });
    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
  });

  it("returns 400 for invalid tier", async () => {
    const res = await POST(makeReq({ tier: "enterprise" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid tier");
  });

  it("returns 500 when STRIPE_SECRET_KEY is missing", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await POST(makeReq({ tier: "pro" }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when Stripe API fails", async () => {
    mockStripeCheckoutCreate.mockRejectedValue(new Error("Stripe down"));
    const res = await POST(makeReq({ tier: "pro" }));
    expect(res.status).toBe(500);
  });
});
