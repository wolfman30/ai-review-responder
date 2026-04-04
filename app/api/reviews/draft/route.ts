import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import Anthropic from "@anthropic-ai/sdk";

/**
 * POST: Generate an AI draft response for a review.
 * Body: { reviewId, tone? }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { reviewId, tone } = await request.json();

    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        location: { userId: user.id },
      },
      include: { location: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const selectedTone = tone || "Professional and warm";
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: `You are a professional business reputation manager. Write a response to this customer review on behalf of ${review.location.name}. Tone should be ${selectedTone}. Response should be 2-4 sentences, genuine, not templated-sounding, and encourage the customer to return. Never make up specific details. Sign off with the business name.`,
      messages: [
        {
          role: "user",
          content: `${review.rating}-star review from ${review.authorName}: ${review.text || "(no text, just a star rating)"}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const draft = textBlock && textBlock.type === "text" ? textBlock.text : "";

    await prisma.review.update({
      where: { id: review.id },
      data: {
        aiDraft: draft,
        status: "drafted",
      },
    });

    return NextResponse.json({ draft });
  } catch (err) {
    console.error("Draft generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate draft" },
      { status: 500 }
    );
  }
}
