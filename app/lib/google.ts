import { OAuth2Client } from "google-auth-library";
import { prisma } from "./db";

const SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(state?: string): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: state || "",
  });
}

export async function getAuthenticatedClient(
  userId: string
): Promise<OAuth2Client | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.googleRefreshToken) return null;

  const client = getOAuth2Client();
  client.setCredentials({
    access_token: user.googleAccessToken || undefined,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry
      ? new Date(user.googleTokenExpiry).getTime()
      : undefined,
  });

  // Auto-refresh if expired
  const tokenInfo = client.credentials;
  if (
    tokenInfo.expiry_date &&
    tokenInfo.expiry_date < Date.now() + 60 * 1000
  ) {
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);

    // Persist new tokens
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: credentials.access_token || undefined,
        googleTokenExpiry: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : undefined,
      },
    });
  }

  return client;
}

// ---------------------
// Google Business Profile API helpers
// ---------------------

const GBP_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";
const GBP_ACCOUNT_BASE = "https://mybusinessaccountmanagement.googleapis.com/v1";

interface GBPAccount {
  name: string; // accounts/{id}
  accountName: string;
  type: string;
}

interface GBPLocation {
  name: string; // accounts/{id}/locations/{id}
  title: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
  };
  phoneNumbers?: { primaryPhone?: string };
}

interface GBPReview {
  name: string; // accounts/{id}/locations/{id}/reviews/{id}
  reviewId: string;
  reviewer: { displayName: string; profilePhotoUrl?: string };
  starRating: string; // ONE, TWO, THREE, FOUR, FIVE
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

const STAR_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export async function fetchAccounts(
  accessToken: string
): Promise<GBPAccount[]> {
  const res = await fetch(`${GBP_ACCOUNT_BASE}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch GBP accounts: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.accounts || [];
}

export async function fetchLocations(
  accessToken: string,
  accountName: string
): Promise<GBPLocation[]> {
  const res = await fetch(`${GBP_BASE}/${accountName}/locations?readMask=name,title,storefrontAddress,phoneNumbers`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch locations: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.locations || [];
}

export async function fetchReviews(
  accessToken: string,
  locationName: string,
  pageSize = 50
): Promise<GBPReview[]> {
  // The reviews endpoint uses the older v4 API
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${locationName}/reviews?pageSize=${pageSize}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch reviews: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.reviews || [];
}

export async function replyToReview(
  accessToken: string,
  reviewName: string,
  comment: string
): Promise<void> {
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to reply to review: ${res.status} ${err}`);
  }
}

export function parseStarRating(rating: string): number {
  return STAR_MAP[rating] || 0;
}

export type { GBPAccount, GBPLocation, GBPReview };
