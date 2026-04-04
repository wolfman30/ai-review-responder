import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { kv } from "@vercel/kv";

export async function GET(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ isPro: false }, { status: 402 });
    }

    const email =
      session.customer_email ||
      session.customer_details?.email ||
      null;

    if (!email) {
      return NextResponse.json({ isPro: false }, { status: 400 });
    }

    // Store Pro status (idempotent — webhook may have already done this)
    await kv.set(`pro:${email.toLowerCase()}`, {
      customerId: session.customer,
      subscriptionId: session.subscription,
      activatedAt: Date.now(),
    });

    return NextResponse.json({ isPro: true, email });
  } catch (err) {
    console.error("verify-session error:", err);
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 });
  }
}
