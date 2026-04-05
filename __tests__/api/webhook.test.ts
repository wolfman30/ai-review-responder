import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, mockStripeConstructEvent } from "../setup";

import { POST } from "@/app/api/webhook/route";

function makeWebhookReq(body: string, sig = "valid-sig") {
  return new NextRequest("http://localhost:3000/api/webhook", {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": sig,
    },
  });
}

describe("POST /api/webhook", () => {
  it("returns 400 on missing stripe-signature", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhook", {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid signature", async () => {
    mockStripeConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });
    const res = await POST(makeWebhookReq("{}", "bad-sig"));
    expect(res.status).toBe(400);
  });

  it("handles checkout.session.completed — sets pro tier for existing user", async () => {
    mockStripeConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      id: "evt_123",
      data: {
        object: {
          customer_email: "user@test.com",
          customer: "cus_123",
          metadata: { tier: "pro" },
          amount_total: 4900,
        },
      },
    });
    mockPrisma.user.findUnique.mockResolvedValue({ id: "u1", email: "user@test.com", tier: "free" });
    mockPrisma.user.update.mockResolvedValue({ tier: "pro" });

    const res = await POST(makeWebhookReq("{}"));
    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "user@test.com" },
        data: expect.objectContaining({ tier: "pro" }),
      })
    );
  });

  it("handles checkout.session.completed — creates new user", async () => {
    mockStripeConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      id: "evt_124",
      data: {
        object: {
          customer_email: "new@test.com",
          customer: "cus_124",
          metadata: { tier: "business" },
          amount_total: 9900,
        },
      },
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ email: "new@test.com", tier: "business" });

    const res = await POST(makeWebhookReq("{}"));
    expect(res.status).toBe(200);
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: "new@test.com", tier: "business" }),
      })
    );
  });

  it("handles subscription.updated — updates tier", async () => {
    mockStripeConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      id: "evt_125",
      data: {
        object: {
          customer: "cus_123",
          status: "active",
          items: { data: [{ price: { unit_amount: 9900 } }] },
        },
      },
    });
    mockPrisma.user.findFirst.mockResolvedValue({ id: "u1", email: "user@test.com" });
    mockPrisma.user.update.mockResolvedValue({ tier: "business" });

    const res = await POST(makeWebhookReq("{}"));
    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { tier: "business" },
      })
    );
  });

  it("handles subscription.updated — sets free when not active", async () => {
    mockStripeConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      id: "evt_126",
      data: {
        object: {
          customer: "cus_123",
          status: "canceled",
          items: { data: [{ price: { unit_amount: 4900 } }] },
        },
      },
    });
    mockPrisma.user.findFirst.mockResolvedValue({ id: "u1" });
    mockPrisma.user.update.mockResolvedValue({ tier: "free" });

    const res = await POST(makeWebhookReq("{}"));
    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { tier: "free" } })
    );
  });

  it("handles subscription.deleted — downgrades to free", async () => {
    mockStripeConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      id: "evt_127",
      data: {
        object: { customer: "cus_123" },
      },
    });
    mockPrisma.user.findFirst.mockResolvedValue({ id: "u1", email: "user@test.com" });
    mockPrisma.user.update.mockResolvedValue({ tier: "free" });

    const res = await POST(makeWebhookReq("{}"));
    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { tier: "free" } })
    );
  });

  it("returns 500 on handler error (NOT 200)", async () => {
    mockStripeConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      id: "evt_128",
      data: {
        object: {
          customer_email: "user@test.com",
          customer: "cus_123",
          metadata: { tier: "pro" },
        },
      },
    });
    mockPrisma.user.findUnique.mockRejectedValue(new Error("DB down"));

    const res = await POST(makeWebhookReq("{}"));
    expect(res.status).toBe(500);
  });

  it("returns 500 when STRIPE_SECRET_KEY is missing", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await POST(makeWebhookReq("{}"));
    expect(res.status).toBe(500);
  });

  it("returns 500 when STRIPE_WEBHOOK_SECRET is missing", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(makeWebhookReq("{}"));
    expect(res.status).toBe(500);
  });

  it("handles checkout with no email gracefully", async () => {
    mockStripeConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      id: "evt_129",
      data: {
        object: {
          customer_email: null,
          customer: "cus_123",
          metadata: {},
        },
      },
    });
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await POST(makeWebhookReq("{}"));
    expect(res.status).toBe(200); // Still 200 — event handled, just no-op
    consoleSpy.mockRestore();
  });
});
