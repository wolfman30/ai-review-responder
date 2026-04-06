import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { isAdminRequest } from "@/app/lib/admin";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const feedback = await prisma.feedbackSubmission.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Admin feedback error:", error);
    return NextResponse.json(
      { error: "Failed to load feedback" },
      { status: 500 }
    );
  }
}
