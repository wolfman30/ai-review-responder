import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/app/lib/db";

/**
 * POST: Generate a free review health audit report.
 * Body: { businessName, email }
 *
 * This is a lead magnet — uses AI to generate a useful report
 * based on the business name, captures the email for nurture.
 */
export async function POST(request: NextRequest) {
  try {
    const { businessName, email } = await request.json();

    if (!businessName || !email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Business name and valid email are required" },
        { status: 400 }
      );
    }

    // Save the lead
    await prisma.auditLead.create({
      data: {
        email: email.toLowerCase().trim(),
        businessName: businessName.trim(),
      },
    });

    // Generate audit report using AI
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: `You are an expert in online reputation management for local businesses. Generate a "Review Health Audit" report for a business. Since you don't have access to their actual reviews, provide actionable general advice specific to their business type. Structure the report with these sections:

1. **Review Response Best Practices** (2-3 tips specific to their business type)
2. **Common Review Patterns** (what customers in this industry typically mention)
3. **Response Templates** (2 example responses — one for a positive review, one for a negative review, customized for their business)
4. **Quick Wins** (3 actionable things they can do this week to improve their review profile)
5. **Rating Impact** (brief explanation of how responding to reviews affects their Google ranking)

Be specific to the business name and type. Keep it practical and actionable. Use markdown formatting.`,
      messages: [
        {
          role: "user",
          content: `Generate a Review Health Audit for "${businessName}". Infer the business type from the name.`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const report = textBlock ? textBlock.text : "";

    return NextResponse.json({ report, businessName });
  } catch (err) {
    console.error("Audit error:", err);
    return NextResponse.json(
      { error: "Failed to generate audit" },
      { status: 500 }
    );
  }
}
