import { describe, it, expect } from "vitest";
import { mockPrisma, mockCookieStore, TEST_USER } from "../setup";

import {
  getCurrentUser,
  getCurrentUserId,
  setSessionCookie,
  clearSessionCookie,
  findOrCreateUser,
  getLocationLimit,
} from "@/app/lib/auth";

describe("getCurrentUser", () => {
  it("returns user when session cookie exists", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-123" });
    mockPrisma.user.findUnique.mockResolvedValue({ ...TEST_USER, locations: [] });

    const user = await getCurrentUser();
    expect(user).toBeTruthy();
    expect(user!.id).toBe("user-123");
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-123" },
      include: { locations: true },
    });
  });

  it("returns null when no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });
});

describe("getCurrentUserId", () => {
  it("returns userId from cookie", async () => {
    mockCookieStore.get.mockReturnValue({ value: "user-456" });
    const id = await getCurrentUserId();
    expect(id).toBe("user-456");
  });

  it("returns falsy when no cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const id = await getCurrentUserId();
    expect(id).toBeFalsy();
  });
});

describe("setSessionCookie", () => {
  it("sets httpOnly secure cookie with 30-day maxAge", async () => {
    await setSessionCookie("user-789");
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "reviewai_session",
      "user-789",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      })
    );
  });
});

describe("clearSessionCookie", () => {
  it("deletes the session cookie", async () => {
    await clearSessionCookie();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("reviewai_session");
  });
});

describe("findOrCreateUser", () => {
  it("returns existing user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(TEST_USER);
    const user = await findOrCreateUser("Test@Example.com");
    expect(user.email).toBe(TEST_USER.email);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
  });

  it("creates new user when not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ ...TEST_USER, email: "new@test.com" });
    const user = await findOrCreateUser("New@Test.com");
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: { email: "new@test.com" },
    });
    expect(user.email).toBe("new@test.com");
  });

  it("normalizes email with trim and lowercase", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(TEST_USER);
    await findOrCreateUser("  Test@Example.COM  ");
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
  });
});

describe("getLocationLimit", () => {
  it("returns 5 for business tier", () => {
    expect(getLocationLimit("business")).toBe(5);
  });

  it("returns 1 for pro tier", () => {
    expect(getLocationLimit("pro")).toBe(1);
  });

  it("returns 0 for free tier", () => {
    expect(getLocationLimit("free")).toBe(0);
  });

  it("returns 0 for unknown tier", () => {
    expect(getLocationLimit("enterprise")).toBe(0);
  });
});
