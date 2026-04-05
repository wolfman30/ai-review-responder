import { describe, it, expect, vi } from "vitest";
import { mockPrisma, mockFetch, mockOAuth2Client, TEST_USER } from "../setup";

import {
  getOAuth2Client,
  getAuthUrl,
  getAuthenticatedClient,
  parseStarRating,
  fetchAccounts,
  fetchLocations,
  fetchReviews,
  replyToReview,
} from "@/app/lib/google";

describe("getOAuth2Client", () => {
  it("creates OAuth2Client with env vars", () => {
    const client = getOAuth2Client();
    expect(client).toBeTruthy();
  });

  it("throws when GOOGLE_CLIENT_ID is missing", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    expect(() => getOAuth2Client()).toThrow("Missing GOOGLE_CLIENT_ID");
  });

  it("throws when GOOGLE_CLIENT_SECRET is missing", () => {
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(() => getOAuth2Client()).toThrow("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  });
});

describe("getAuthUrl", () => {
  it("returns a Google OAuth URL", () => {
    const url = getAuthUrl("test-state");
    expect(url).toContain("accounts.google.com");
  });
});

describe("getAuthenticatedClient", () => {
  it("returns null when user has no refresh token", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...TEST_USER, googleRefreshToken: null });
    const client = await getAuthenticatedClient("user-123");
    expect(client).toBeNull();
  });

  it("returns null when user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const client = await getAuthenticatedClient("nonexistent");
    expect(client).toBeNull();
  });

  it("returns client with valid credentials", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(TEST_USER);
    const client = await getAuthenticatedClient("user-123");
    expect(client).toBeTruthy();
  });

  it("auto-refreshes expired token and persists to DB", async () => {
    const expiredUser = {
      ...TEST_USER,
      googleTokenExpiry: new Date(Date.now() - 60000), // expired 1 min ago
    };
    mockPrisma.user.findUnique.mockResolvedValue(expiredUser);
    mockPrisma.user.update.mockResolvedValue(expiredUser);

    // Mock the OAuth2Client to have expired credentials
    mockOAuth2Client.credentials = {
      ...mockOAuth2Client.credentials,
      expiry_date: Date.now() - 60000, // expired
    };
    mockOAuth2Client.refreshAccessToken.mockResolvedValue({
      credentials: {
        access_token: "new-access-token",
        expiry_date: Date.now() + 3600000,
      },
    });

    const client = await getAuthenticatedClient("user-123");
    expect(client).toBeTruthy();
    expect(mockOAuth2Client.refreshAccessToken).toHaveBeenCalled();
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          googleAccessToken: "new-access-token",
        }),
      })
    );
  });
});

describe("parseStarRating", () => {
  it("maps ONE through FIVE correctly", () => {
    expect(parseStarRating("ONE")).toBe(1);
    expect(parseStarRating("TWO")).toBe(2);
    expect(parseStarRating("THREE")).toBe(3);
    expect(parseStarRating("FOUR")).toBe(4);
    expect(parseStarRating("FIVE")).toBe(5);
  });

  it("returns 0 for unknown rating", () => {
    expect(parseStarRating("UNKNOWN")).toBe(0);
    expect(parseStarRating("")).toBe(0);
  });
});

describe("fetchAccounts", () => {
  it("returns accounts from Google API", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ accounts: [{ name: "accounts/123", accountName: "Test", type: "PERSONAL" }] }),
    });
    const accounts = await fetchAccounts("mock-token");
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe("accounts/123");
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403, text: () => Promise.resolve("Forbidden") });
    await expect(fetchAccounts("bad-token")).rejects.toThrow("Failed to fetch GBP accounts");
  });

  it("returns empty array when no accounts", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    const accounts = await fetchAccounts("mock-token");
    expect(accounts).toEqual([]);
  });
});

describe("fetchLocations", () => {
  it("returns locations from Google API", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ locations: [{ name: "accounts/1/locations/2", title: "My Biz" }] }),
    });
    const locs = await fetchLocations("mock-token", "accounts/1");
    expect(locs).toHaveLength(1);
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve("Error") });
    await expect(fetchLocations("bad-token", "accounts/1")).rejects.toThrow("Failed to fetch locations");
  });
});

describe("fetchReviews", () => {
  it("returns reviews from Google API", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        reviews: [{ name: "accounts/1/locations/2/reviews/3", reviewId: "3", reviewer: { displayName: "Test" }, starRating: "FIVE", createTime: "2026-01-01T00:00:00Z" }],
      }),
    });
    const reviews = await fetchReviews("mock-token", "accounts/1/locations/2");
    expect(reviews).toHaveLength(1);
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve("Unauthorized") });
    await expect(fetchReviews("bad-token", "accounts/1/locations/2")).rejects.toThrow("Failed to fetch reviews");
  });
});

describe("replyToReview", () => {
  it("sends PUT to Google API", async () => {
    mockFetch.mockResolvedValue({ ok: true });
    await replyToReview("mock-token", "accounts/1/locations/2/reviews/3", "Thanks!");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/reviews/3/reply"),
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("throws on API failure", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve("Error") });
    await expect(replyToReview("bad-token", "r/1", "Reply")).rejects.toThrow("Failed to reply to review");
  });
});
