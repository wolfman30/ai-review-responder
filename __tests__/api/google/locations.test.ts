import { describe, it, expect, vi } from "vitest";
import { mockPrisma, TEST_USER } from "../../setup";

vi.mock("@/app/lib/auth", async () => {
  const actual = await vi.importActual("@/app/lib/auth");
  return { ...actual, getCurrentUser: vi.fn() };
});
vi.mock("@/app/lib/google", async () => {
  const actual = await vi.importActual("@/app/lib/google");
  return {
    ...actual,
    getAuthenticatedClient: vi.fn(),
    fetchAccounts: vi.fn(),
    fetchLocations: vi.fn(),
  };
});

import { GET } from "@/app/api/google/locations/route";
import { getCurrentUser } from "@/app/lib/auth";
import { getAuthenticatedClient, fetchAccounts, fetchLocations } from "@/app/lib/google";

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedGetAuthClient = vi.mocked(getAuthenticatedClient);
const mockedFetchAccounts = vi.mocked(fetchAccounts);
const mockedFetchLocations = vi.mocked(fetchLocations);

describe("GET /api/google/locations", () => {
  it("returns 401 when not authenticated", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns empty array when no Google connection", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      ...TEST_USER,
      googleRefreshToken: null,
      locations: [],
    } as any);
    const res = await GET();
    const data = await res.json();
    expect(data.locations).toEqual([]);
  });

  it("fetches and upserts locations from Google", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, locations: [] } as any);
    mockedGetAuthClient.mockResolvedValue({
      credentials: { access_token: "tok" },
    } as any);
    mockedFetchAccounts.mockResolvedValue([
      { name: "accounts/acc1", accountName: "Test Acct", type: "PERSONAL" },
    ]);
    mockedFetchLocations.mockResolvedValue([
      {
        name: "accounts/acc1/locations/loc1",
        title: "My Business",
        storefrontAddress: { addressLines: ["123 Main St"], locality: "City", administrativeArea: "ST", postalCode: "12345" },
        phoneNumbers: { primaryPhone: "+15551234567" },
      },
    ]);
    mockPrisma.location.upsert.mockResolvedValue({
      id: "db-loc-1",
      name: "My Business",
      address: "123 Main St, City, ST, 12345",
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.locations).toHaveLength(1);
    expect(mockPrisma.location.upsert).toHaveBeenCalled();
  });

  it("returns 401 when Google auth expired", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, locations: [] } as any);
    mockedGetAuthClient.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 500 on unexpected error", async () => {
    mockedGetCurrentUser.mockResolvedValue({ ...TEST_USER, locations: [] } as any);
    mockedGetAuthClient.mockRejectedValue(new Error("Unexpected"));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});
