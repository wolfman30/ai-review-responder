import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, mockAnthropicCreate } from "../setup";

import { POST } from "@/app/api/audit/route";

function makeReq(body: unknown) {
  return new NextRequest("http://localhost:3000/api/audit", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/audit", () => {
  it("creates lead and returns AI report", async () => {
    mockPrisma.auditLead.create.mockResolvedValue({ id: "lead-1" });
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: "text", text: "# Audit Report\nYour business looks great!" }],
    });

    const res = await POST(makeReq({ businessName: "Test Biz", email: "lead@test.com" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.report).toContain("Audit Report");
    expect(data.businessName).toBe("Test Biz");
    expect(mockPrisma.auditLead.create).toHaveBeenCalledWith({
      data: {
        email: "lead@test.com",
        businessName: "Test Biz",
      },
    });
  });

  it("returns 400 when businessName is missing", async () => {
    const res = await POST(makeReq({ email: "test@test.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when email is invalid", async () => {
    const res = await POST(makeReq({ businessName: "Test", email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeReq({ businessName: "Test" }));
    expect(res.status).toBe(400);
  });

  it("returns 500 when ANTHROPIC_API_KEY is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    mockPrisma.auditLead.create.mockResolvedValue({ id: "lead-1" });

    const res = await POST(makeReq({ businessName: "Test", email: "a@b.com" }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when AI API fails", async () => {
    mockPrisma.auditLead.create.mockResolvedValue({ id: "lead-1" });
    mockAnthropicCreate.mockRejectedValue(new Error("AI down"));

    const res = await POST(makeReq({ businessName: "Test", email: "a@b.com" }));
    expect(res.status).toBe(500);
  });
});
