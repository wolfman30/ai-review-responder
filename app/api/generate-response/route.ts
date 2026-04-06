import Anthropic from "@anthropic-ai/sdk";
import type { TextBlock } from "@anthropic-ai/sdk/resources/messages/messages";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/db";
import { cookies } from "next/headers";

const FREE_LIMIT = 5;
const ANON_COOKIE = "reviewai_anon_id";

/**
 * Get or create an anonymous session ID for rate-limiting unauthenticated users.
 * Stored in an httpOnly cookie so it persists across requests.
 */
async function getOrCreateAnonId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(ANON_COOKIE)?.value;
  if (existing) return existing;

  const anonId = `anon_${crypto.randomUUID()}`;
  cookieStore.set(ANON_COOKIE, anonId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90, // 90 days
    path: "/",
  });
  return anonId;
}

export async function POST(request: NextRequest) {
  const { review, businessName, businessType, tone } = await request.json();

  if (!review || !businessName || !businessType || !tone) {
    return NextResponse.json(
      { error: "Missing required fields: review, businessName, businessType, tone" },
      { status: 400 }
    );
  }

  const userEmail = request.headers.get("X-User-Email");
  let isPro = false;

  // Check tier from DB (set by Stripe webhook) instead of hitting Stripe API
  if (userEmail) {
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail.toLowerCase().trim() },
      select: { tier: true },
    });
    isPro = !!dbUser && dbUser.tier !== "free";
  }

  // Enforce free limit server-side for ALL non-Pro users (including anonymous).
  // Uses atomic increment-before-generate to prevent race conditions:
  // 1. Upsert user + reset month if needed
  // 2. Atomically increment count
  // 3. If count > limit, decrement and reject
  // 4. If AI generation fails, decrement to refund the slot
  let rateLimitIdentifier: string | null = null;

  if (!isPro) {
    const now = new Date();
    const identifier = userEmail || (await getOrCreateAnonId());
    rateLimitIdentifier = identifier;

    // Upsert user so we always have a record
    let user = await prisma.user.upsert({
      where: { email: identifier },
      create: { email: identifier, responseCount: 0, responseCountResetAt: now },
      update: {},
    });

    // Reset count if we've rolled into a new calendar month
    const resetAt = new Date(user.responseCountResetAt);
    const isNewMonth =
      resetAt.getFullYear() !== now.getFullYear() ||
      resetAt.getMonth() !== now.getMonth();

    if (isNewMonth) {
      await prisma.user.update({
        where: { email: identifier },
        data: { responseCount: 0, responseCountResetAt: now },
      });
    }

    // Atomically increment and check — prevents concurrent requests
    // from all passing the check before any increment
    user = await prisma.user.update({
      where: { email: identifier },
      data: { responseCount: { increment: 1 } },
    });

    if (user.responseCount > FREE_LIMIT) {
      // Over limit — decrement back and reject
      await prisma.user.update({
        where: { email: identifier },
        data: { responseCount: { decrement: 1 } },
      });
      return NextResponse.json(
        { error: "Free limit reached. Please upgrade to Pro for unlimited responses." },
        { status: 429 }
      );
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error. Please try again later." },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: `You are a professional business reputation manager. Write a response to this customer review on behalf of ${businessName}, a ${businessType}. Tone should be ${tone}. Response should be 2-4 sentences, genuine, not templated-sounding, and encourage the customer to return. Never make up specific details. Sign off with the business name.`,
      messages: [
        {
          role: "user",
          content: review,
        },
      ],
    });

    const responseText = message.content
      .filter((block): block is TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (!responseText) {
      throw new Error("Anthropic returned an empty response");
    }

    return NextResponse.json({ response: responseText });
  } catch (err) {
    console.error("Anthropic API error:", err);

    // Refund the rate limit slot if AI generation failed
    if (rateLimitIdentifier) {
      await prisma.user.update({
        where: { email: rateLimitIdentifier },
        data: { responseCount: { decrement: 1 } },
      }).catch((e: unknown) => console.error("Failed to refund rate limit slot:", e));
    }

    return NextResponse.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    );
  }
}
