import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getCurrentUserId } from "@/app/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { rating, working, improve } = await request.json();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (!working?.trim() || !improve?.trim()) {
      return NextResponse.json({ error: "Both feedback fields are required" }, { status: 400 });
    }

    const submission = await prisma.feedbackSubmission.create({
      data: {
        rating,
        workingWell: working.trim(),
        couldBeBetter: improve.trim(),
        userId: await getCurrentUserId(),
      },
    });

    console.log("Feedback submission received", submission);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Feedback submission error:", err);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
