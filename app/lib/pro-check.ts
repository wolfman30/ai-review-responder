import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  _stripe = new Stripe(key);
  return _stripe;
}

export type UserTier = "free" | "pro" | "business";

/**
 * Check if an email has an active subscription and return the tier.
 * Queries Stripe directly — no KV/DB needed.
 */
export async function getUserTier(email: string): Promise<UserTier> {
  const stripe = getStripe();
  if (!stripe || !email) return "free";

  try {
    const customers = await stripe.customers.list({
      email: email.toLowerCase(),
      limit: 1,
    });

    if (customers.data.length === 0) return "free";

    const customer = customers.data[0];
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 5,
    });

    if (subscriptions.data.length === 0) return "free";

    // Check subscription amount to determine tier
    for (const sub of subscriptions.data) {
      const amount = sub.items.data[0]?.price?.unit_amount || 0;
      if (amount >= 9900) return "business";
      if (amount >= 4900) return "pro";
      // Legacy $19 plan counts as pro
      if (amount >= 1900) return "pro";
    }

    return "free";
  } catch (err) {
    console.error("Tier check error:", err);
    return "free";
  }
}

/**
 * Legacy helper — check if an email has an active Pro subscription.
 */
export async function isProUser(email: string): Promise<boolean> {
  const tier = await getUserTier(email);
  return tier !== "free";
}
