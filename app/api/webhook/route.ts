import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";

// Stripe requires the raw body for signature verification
export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    console.error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const stripe = new Stripe(secretKey);

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email =
          session.customer_email ||
          session.customer_details?.email ||
          null;

        if (email) {
          await kv.set(`pro:${email.toLowerCase()}`, {
            customerId: session.customer,
            subscriptionId: session.subscription,
            activatedAt: Date.now(),
          });
          console.log(`Pro activated for ${email}`);
        }
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        // Only revoke on non-active statuses
        if (
          event.type === "customer.subscription.updated" &&
          (subscription.status === "active" || subscription.status === "trialing")
        ) {
          break;
        }

        // Look up customer email
        const customer = await stripe.customers.retrieve(
          subscription.customer as string
        );

        if (!customer.deleted && customer.email) {
          await kv.del(`pro:${customer.email.toLowerCase()}`);
          console.log(`Pro revoked for ${customer.email}`);
        }
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
