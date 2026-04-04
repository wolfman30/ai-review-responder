import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const TIER_CONFIG: Record<
  string,
  { name: string; description: string; amount: number }
> = {
  pro: {
    name: "ReviewAI Pro",
    description:
      "Unlimited AI responses, Google Business integration, 1 location monitored, email alerts",
    amount: 4900,
  },
  business: {
    name: "ReviewAI Business",
    description:
      "Everything in Pro + up to 5 locations, team access, priority support",
    amount: 9900,
  },
};

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured. Please set STRIPE_SECRET_KEY." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secretKey);
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.headers.get("origin") ||
    "http://localhost:3000";

  let email: string | undefined;
  let tier: string = "pro";

  try {
    const body = await request.json();
    email = body.email || undefined;
    tier = body.tier || "pro";
  } catch {
    // No body is fine, default to pro
  }

  const config = TIER_CONFIG[tier];
  if (!config) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      metadata: { tier },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: config.name,
              description: config.description,
            },
            unit_amount: config.amount,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/app/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/upgrade`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
