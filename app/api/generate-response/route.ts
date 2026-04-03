import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const FREE_LIMIT = 5;

export async function POST(request: NextRequest) {
  const countHeader = request.headers.get("X-Response-Count");
  const responseCount = countHeader ? parseInt(countHeader, 10) : 0;

  if (responseCount >= FREE_LIMIT) {
    return NextResponse.json(
      { error: "Free limit reached. Please upgrade to Pro for unlimited responses." },
      { status: 429 }
    );
  }

  const { review, businessName, businessType, tone } = await request.json();

  if (!review || !businessName || !businessType || !tone) {
    return NextResponse.json(
      { error: "Missing required fields: review, businessName, businessType, tone" },
      { status: 400 }
    );
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
      model: "claude-3-5-haiku-20241022",
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

    return NextResponse.json({ response: responseText });
  } catch (err) {
    console.error("Anthropic API error:", err);
    return NextResponse.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    );
  }
}
