import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/auth/login/route";

describe("POST /api/auth/login", () => {
  it("returns 410 with disabled message", async () => {
    const res = await POST();
    expect(res.status).toBe(410);
    const data = await res.json();
    expect(data.error).toContain("Email login is disabled");
    expect(data.error).toContain("Google");
  });
});
