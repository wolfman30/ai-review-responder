import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import { getAuthenticatedClient, fetchAccounts, fetchLocations } from "@/app/lib/google";
import { prisma } from "@/app/lib/db";

/**
 * GET: List locations from Google Business Profile and sync to DB.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!user.googleRefreshToken) {
      return NextResponse.json(
        { error: "Google account not connected", locations: [] },
        { status: 200 }
      );
    }

    const client = await getAuthenticatedClient(user.id);
    if (!client || !client.credentials.access_token) {
      return NextResponse.json(
        { error: "Google auth expired. Please reconnect." },
        { status: 401 }
      );
    }

    const accessToken = client.credentials.access_token;

    // Fetch accounts
    const accounts = await fetchAccounts(accessToken);

    // Fetch locations for each account
    const allLocations = [];
    for (const account of accounts) {
      const locations = await fetchLocations(accessToken, account.name);
      for (const loc of locations) {
        const accountId = account.name.replace("accounts/", "");
        const locationId = loc.name.split("/").pop() || "";
        const address = loc.storefrontAddress
          ? [
              ...(loc.storefrontAddress.addressLines || []),
              loc.storefrontAddress.locality,
              loc.storefrontAddress.administrativeArea,
              loc.storefrontAddress.postalCode,
            ]
              .filter(Boolean)
              .join(", ")
          : null;

        // Upsert location in DB
        const dbLocation = await prisma.location.upsert({
          where: {
            googleAccountId_googleLocationId: {
              googleAccountId: accountId,
              googleLocationId: locationId,
            },
          },
          update: {
            name: loc.title,
            address,
            phone: loc.phoneNumbers?.primaryPhone || null,
          },
          create: {
            userId: user.id,
            googleAccountId: accountId,
            googleLocationId: locationId,
            name: loc.title,
            address,
            phone: loc.phoneNumbers?.primaryPhone || null,
          },
        });

        allLocations.push(dbLocation);
      }
    }

    return NextResponse.json({ locations: allLocations });
  } catch (err) {
    console.error("Fetch locations error:", err);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
