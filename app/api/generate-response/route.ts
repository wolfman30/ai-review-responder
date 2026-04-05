import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { isProUser } from "../../lib/pro-check";
import { prisma } from "../../lib/db";

const FREE_LIMIT = 5;

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

  if (userEmail) {
    isPro = await isProUser(userEmail);
  }

  // Enforce free limit server-side for non-Pro users with a known email
  if (!isPro && userEmail) {
    const now = new Date();

    // Upsert user so we always have a record to check/update
    let user = await prisma.user.upsert({
      where: { email: userEmail },
      create: { email: userEmail, responseCount: 0, responseCountResetAt: now },
      update: {},
    });

    // Reset count if we've rolled into a new calendar month
    const resetAt = new Date(user.responseCountResetAt);
    const isNewMonth =
      resetAt.getFullYear() !== now.getFullYear() ||
      resetAt.getMonth() !== now.getMonth();

    if (isNewMonth) {
      user = await prisma.user.update({
        where: { email: userEmail },
        data: { responseCount: 0, responseCountResetAt: now },
      });
    }

    if (user.responseCount >= FREE_LIMIT) {
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

    const textBlock = message.content.find((block) => block.type === "text");
    const responseText = textBlock ? textBlock.text : "";

    // Increment server-side counter for free users
    if (!isPro && userEmail) {
      await prisma.user.update({
        where: { email: userEmail },
        data: { responseCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ response: responseText });
  } catch (err) {
    console.error("Anthropic API error:", err);
    return NextResponse.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    );
  }
}
