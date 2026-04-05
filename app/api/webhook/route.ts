import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/app/lib/db";

export const runtime = "nodejs";

/**
 * Determine user tier from a Stripe subscription amount (in cents).
 */
function tierFromAmount(amountCents: number): "pro" | "business" {
  if (amountCents >= 9900) return "business";
  // $49 and legacy $19 both map to pro
  return "pro";
}

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

  console.log(`Stripe webhook received: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      // New subscription created via Checkout
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_email;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        if (!email) {
          console.warn("checkout.session.completed: no customer_email");
          break;
        }

        // Determine tier from metadata or subscription amount
        let tier: "pro" | "business" = "pro";
        if (session.metadata?.tier === "business") {
          tier = "business";
        } else if (session.metadata?.tier === "pro") {
          tier = "pro";
        } else if (session.amount_total) {
          tier = tierFromAmount(session.amount_total);
        }

        // Update or create user in DB
        const existingUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (existingUser) {
          await prisma.user.update({
            where: { email: email.toLowerCase() },
            data: {
              tier,
              stripeCustomerId: customerId || existingUser.stripeCustomerId,
            },
          });
        } else {
          await prisma.user.create({
            data: {
              email: email.toLowerCase(),
              tier,
              stripeCustomerId: customerId || undefined,
            },
          });
        }

        console.log(`Set tier=${tier} for ${email} via checkout.session.completed`);
        break;
      }

      // Subscription updated (upgrade/downgrade)
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const amount = subscription.items.data[0]?.price?.unit_amount || 0;
        const tier = tierFromAmount(amount);
        const isActive =
          subscription.status === "active" ||
          subscription.status === "trialing";

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { tier: isActive ? tier : "free" },
          });
          console.log(
            `Updated tier=${isActive ? tier : "free"} for ${user.email} via subscription.updated`
          );
        }
        break;
      }

      // Subscription canceled or expired
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { tier: "free" },
          });
          console.log(`Downgraded ${user.email} to free via subscription.deleted`);
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    // Return 500 so Stripe retries — the event was valid but our
    // handler failed (e.g. DB down). Stripe retries with exponential
    // backoff for up to 72 hours, which is what we want.
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
