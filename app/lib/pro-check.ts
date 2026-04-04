import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  _stripe = new Stripe(key);
  return _stripe;
}

/**
 * Check if an email has an active Pro subscription.
 * Queries Stripe directly — no KV/DB needed.
 */
export async function isProUser(email: string): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe || !email) return false;

  try {
    const customers = await stripe.customers.list({
      email: email.toLowerCase(),
      limit: 1,
    });

    if (customers.data.length === 0) return false;

    const customer = customers.data[0];
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 1,
    });

    return subscriptions.data.length > 0;
  } catch (err) {
    console.error("Pro check error:", err);
    return false;
  }
}
