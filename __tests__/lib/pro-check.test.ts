import { describe, it, expect } from "vitest";
import { mockStripeCustomersList, mockStripeSubscriptionsList } from "../setup";

import { getUserTier, isProUser } from "@/app/lib/pro-check";

describe("getUserTier", () => {
  it("returns free when no Stripe key", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const tier = await getUserTier("test@test.com");
    expect(tier).toBe("free");
  });

  it("returns free when no email", async () => {
    const tier = await getUserTier("");
    expect(tier).toBe("free");
  });

  it("returns free when no customer found", async () => {
    mockStripeCustomersList.mockResolvedValue({ data: [] });
    const tier = await getUserTier("test@test.com");
    expect(tier).toBe("free");
  });

  it("returns free when no active subscriptions", async () => {
    mockStripeCustomersList.mockResolvedValue({ data: [{ id: "cus_123" }] });
    mockStripeSubscriptionsList.mockResolvedValue({ data: [] });
    const tier = await getUserTier("test@test.com");
    expect(tier).toBe("free");
  });

  it("returns pro for $49 subscription", async () => {
    mockStripeCustomersList.mockResolvedValue({ data: [{ id: "cus_123" }] });
    mockStripeSubscriptionsList.mockResolvedValue({
      data: [{ items: { data: [{ price: { unit_amount: 4900 } }] } }],
    });
    const tier = await getUserTier("test@test.com");
    expect(tier).toBe("pro");
  });

  it("returns business for $99 subscription", async () => {
    mockStripeCustomersList.mockResolvedValue({ data: [{ id: "cus_123" }] });
    mockStripeSubscriptionsList.mockResolvedValue({
      data: [{ items: { data: [{ price: { unit_amount: 9900 } }] } }],
    });
    const tier = await getUserTier("test@test.com");
    expect(tier).toBe("business");
  });

  it("returns pro for legacy $19 subscription", async () => {
    mockStripeCustomersList.mockResolvedValue({ data: [{ id: "cus_123" }] });
    mockStripeSubscriptionsList.mockResolvedValue({
      data: [{ items: { data: [{ price: { unit_amount: 1900 } }] } }],
    });
    const tier = await getUserTier("test@test.com");
    expect(tier).toBe("pro");
  });

  it("returns free on Stripe error", async () => {
    mockStripeCustomersList.mockRejectedValue(new Error("Stripe down"));
    const tier = await getUserTier("test@test.com");
    expect(tier).toBe("free");
  });
});

describe("isProUser", () => {
  it("returns true for pro user", async () => {
    mockStripeCustomersList.mockResolvedValue({ data: [{ id: "cus_123" }] });
    mockStripeSubscriptionsList.mockResolvedValue({
      data: [{ items: { data: [{ price: { unit_amount: 4900 } }] } }],
    });
    expect(await isProUser("test@test.com")).toBe(true);
  });

  it("returns false for free user", async () => {
    mockStripeCustomersList.mockResolvedValue({ data: [] });
    expect(await isProUser("test@test.com")).toBe(false);
  });
});
