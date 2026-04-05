/**
 * Schema Drift Detection Test
 *
 * Validates that the production Turso database schema matches what
 * Prisma expects. This catches the exact bug we hit on 2026-04-05:
 * a migration was added to Prisma but never applied to Turso,
 * causing OAuth callback to crash on missing columns.
 *
 * Requires DATABASE_URL to point to the real Turso instance.
 * Skips gracefully if DATABASE_URL is not a libsql:// URL (local dev).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Only import libsql client dynamically to avoid breaking local-only runs
let client: Awaited<ReturnType<typeof createTursoClient>> | null = null;

async function createTursoClient() {
  const { createClient } = await import("@libsql/client");
  const url = process.env.DATABASE_URL || "";

  // Extract authToken from URL query params
  const urlObj = new URL(url);
  const authToken = urlObj.searchParams.get("authToken") || undefined;
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

  return createClient({ url: baseUrl, authToken });
}

// Expected schema derived from prisma/schema.prisma
// Each table maps to its expected column names (order doesn't matter)
const EXPECTED_SCHEMA: Record<string, string[]> = {
  User: [
    "id",
    "email",
    "stripeCustomerId",
    "tier",
    "googleAccessToken",
    "googleRefreshToken",
    "googleTokenExpiry",
    "alertsEnabled",
    "responseCount",
    "responseCountResetAt",
    "createdAt",
    "updatedAt",
  ],
  Location: [
    "id",
    "userId",
    "googleAccountId",
    "googleLocationId",
    "name",
    "address",
    "phone",
    "avgRating",
    "totalReviews",
    "isMonitored",
    "lastSyncedAt",
    "createdAt",
    "updatedAt",
  ],
  Review: [
    "id",
    "locationId",
    "googleReviewId",
    "authorName",
    "authorPhotoUrl",
    "rating",
    "text",
    "reviewDate",
    "aiDraft",
    "finalResponse",
    "respondedAt",
    "status",
    "createdAt",
    "updatedAt",
  ],
  AuditLead: ["id", "email", "businessName", "businessUrl", "createdAt"],
};

const isLibsqlUrl = (process.env.DATABASE_URL || "").startsWith("libsql://");

describe.skipIf(!isLibsqlUrl)("Schema Drift Detection (Turso)", () => {
  beforeAll(async () => {
    client = await createTursoClient();
  });

  afterAll(async () => {
    client = null;
  });

  it("all expected tables exist", async () => {
    const result = await client!.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%' AND name NOT LIKE 'sqlite_%'"
    );
    const tableNames = result.rows.map((r) => r.name as string);

    for (const table of Object.keys(EXPECTED_SCHEMA)) {
      expect(tableNames, `Missing table: ${table}`).toContain(table);
    }
  });

  for (const [table, expectedColumns] of Object.entries(EXPECTED_SCHEMA)) {
    it(`${table} has all expected columns`, async () => {
      const result = await client!.execute(`PRAGMA table_info("${table}")`);
      const actualColumns = result.rows.map((r) => r.name as string);

      const missing = expectedColumns.filter((c) => !actualColumns.includes(c));
      const extra = actualColumns.filter((c) => !expectedColumns.includes(c));

      expect(
        missing,
        `${table} is missing columns: ${missing.join(", ")}. ` +
          `This likely means a Prisma migration wasn't applied to Turso. ` +
          `Fix: run the migration SQL against Turso directly.`
      ).toEqual([]);

      // Extra columns are warnings, not failures (backwards-compatible)
      if (extra.length > 0) {
        console.warn(
          `⚠️  ${table} has extra columns not in Prisma schema: ${extra.join(", ")}`
        );
      }
    });
  }

  it("User.email has a unique index", async () => {
    const result = await client!.execute(
      `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='User' AND sql LIKE '%UNIQUE%'`
    );
    const indexNames = result.rows.map((r) => r.name as string);
    const hasEmailUnique = indexNames.some((n) => n.includes("email"));
    expect(hasEmailUnique, "User.email unique index missing").toBe(true);
  });
});
