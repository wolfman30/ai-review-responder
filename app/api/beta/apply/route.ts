import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { firstName, businessName, email, businessType, challenge } = await request.json();

    if (!firstName || !businessName || !email || !businessType) {
      return NextResponse.json({ error: "First name, business name, email, and business type are required" }, { status: 400 });
    }

    const application = await prisma.betaApplication.create({
      data: {
        firstName: firstName.trim(),
        businessName: businessName.trim(),
        email: email.toLowerCase().trim(),
        businessType,
        challenge: challenge?.trim() || null,
      },
    });

    console.log("Beta application received for andrew@aiwolfsolutions.com", application);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Beta application error:", err);
    return NextResponse.json({ error: "Failed to save beta application" }, { status: 500 });
  }
}
