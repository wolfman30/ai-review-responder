import { describe, it, expect } from "vitest";

// The db module is mocked globally, but we can verify the mock is wired correctly
import { prisma } from "@/app/lib/db";

describe("prisma client", () => {
  it("exports a prisma instance with user model", () => {
    expect(prisma).toBeTruthy();
    expect(prisma.user).toBeTruthy();
  });

  it("exports a prisma instance with review model", () => {
    expect(prisma.review).toBeTruthy();
  });

  it("exports a prisma instance with location model", () => {
    expect(prisma.location).toBeTruthy();
  });

  it("exports a prisma instance with auditLead model", () => {
    expect(prisma.auditLead).toBeTruthy();
  });
});
