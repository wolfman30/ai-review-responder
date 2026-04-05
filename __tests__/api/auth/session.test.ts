import { describe, it, expect } from "vitest";
import { mockPrisma, mockCookieStore, TEST_USER } from "../../setup";

import { GET } from "@/app/api/auth/session/route";

describe("GET /api/auth/session", () => {
  it("returns user data when logged in", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-123" });
    mockPrisma.user.findUnique.mockResolvedValue({
      ...TEST_USER,
      locations: [{ id: "loc-1" }, { id: "loc-2" }],
    });

    const res = await GET();
    const data = await res.json();

    expect(data.user).toBeTruthy();
    expect(data.user.id).toBe("user-123");
    expect(data.user.email).toBe("test@example.com");
    expect(data.user.tier).toBe("free");
    expect(data.user.hasGoogle).toBe(true); // has googleRefreshToken
    expect(data.user.locationCount).toBe(2);
  });

  it("returns null when not logged in", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await GET();
    const data = await res.json();
    expect(data.user).toBeNull();
  });

  it("returns null on error", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-123" });
    mockPrisma.user.findUnique.mockRejectedValue(new Error("DB down"));

    const res = await GET();
    const data = await res.json();
    expect(data.user).toBeNull();
  });

  it("returns hasGoogle false when no refresh token", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-123" });
    mockPrisma.user.findUnique.mockResolvedValue({
      ...TEST_USER,
      googleRefreshToken: null,
      locations: [],
    });

    const res = await GET();
    const data = await res.json();
    expect(data.user.hasGoogle).toBe(false);
  });
});
