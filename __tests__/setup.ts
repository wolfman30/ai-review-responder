import { vi, beforeEach } from "vitest";

// ── Prisma Mock ──────────────────────────────────────────────
const makeCrudMock = () => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
  aggregate: vi.fn(),
});

export const mockPrisma = {
  user: makeCrudMock(),
  review: makeCrudMock(),
  location: makeCrudMock(),
  auditLead: makeCrudMock(),
};

vi.mock("@/app/lib/db", () => ({
  prisma: mockPrisma,
}));

// ── Cookies Mock ─────────────────────────────────────────────
export const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookieStore),
}));

// ── Anthropic Mock ───────────────────────────────────────────
export const mockAnthropicCreate = vi.fn().mockResolvedValue({
  content: [{ type: "text", text: "AI generated response" }],
});

vi.mock("@anthropic-ai/sdk", () => {
  const AnthropicMock = function () {
    return {
      messages: { create: mockAnthropicCreate },
    };
  };
  return { default: AnthropicMock };
});

// ── Stripe Mock ──────────────────────────────────────────────
export const mockStripeCheckoutCreate = vi.fn();
export const mockStripeCheckoutRetrieve = vi.fn();
export const mockStripeCustomersList = vi.fn();
export const mockStripeSubscriptionsList = vi.fn();
export const mockStripeConstructEvent = vi.fn();

vi.mock("stripe", () => {
  const StripeMock = function () {
    return {
      checkout: {
        sessions: {
          create: mockStripeCheckoutCreate,
          retrieve: mockStripeCheckoutRetrieve,
        },
      },
      customers: { list: mockStripeCustomersList },
      subscriptions: { list: mockStripeSubscriptionsList },
      webhooks: { constructEvent: mockStripeConstructEvent },
    };
  };
  return { default: StripeMock };
});

// ── SES Mock ─────────────────────────────────────────────────
export const mockSESSend = vi.fn().mockResolvedValue({});

vi.mock("@aws-sdk/client-ses", () => {
  const SESClientMock = function () {
    return { send: mockSESSend };
  };
  const SendEmailCommandMock = function (params: unknown) {
    return params;
  };
  return { SESClient: SESClientMock, SendEmailCommand: SendEmailCommandMock };
});

// ── Google Auth Mock ─────────────────────────────────────────
export const mockOAuth2Client = {
  generateAuthUrl: vi.fn().mockReturnValue("https://accounts.google.com/o/oauth2/auth?mock=1"),
  getToken: vi.fn().mockResolvedValue({
    tokens: {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expiry_date: Date.now() + 3600000,
    },
  }),
  setCredentials: vi.fn(),
  refreshAccessToken: vi.fn().mockResolvedValue({
    credentials: {
      access_token: "refreshed-access-token",
      expiry_date: Date.now() + 3600000,
    },
  }),
  credentials: {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expiry_date: Date.now() + 3600000,
  },
};

vi.mock("google-auth-library", () => {
  const OAuth2ClientMock = function () {
    return mockOAuth2Client;
  };
  return { OAuth2Client: OAuth2ClientMock };
});

// ── Global fetch Mock ────────────────────────────────────────
export const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ── Env Defaults ─────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
  process.env.STRIPE_SECRET_KEY = "test-stripe-key";
  process.env.STRIPE_WEBHOOK_SECRET = "test-webhook-secret";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  process.env.GOOGLE_CLIENT_ID = "test-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
  process.env.CRON_SECRET = "test-cron-secret";
});

// ── Helpers ──────────────────────────────────────────────────
export function makeNextRequest(
  url: string,
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }
) {
  const { method = "GET", body, headers = {} } = options || {};
  const reqUrl = new URL(url, "http://localhost:3000");

  return {
    method,
    url: reqUrl.toString(),
    nextUrl: reqUrl,
    headers: new Map(Object.entries(headers)),
    json: vi.fn().mockResolvedValue(body || {}),
    text: vi.fn().mockResolvedValue(typeof body === "string" ? body : JSON.stringify(body || {})),
  } as unknown;
}

export const TEST_USER = {
  id: "user-123",
  email: "test@example.com",
  tier: "free",
  stripeCustomerId: null,
  googleAccessToken: "mock-access-token",
  googleRefreshToken: "mock-refresh-token",
  googleTokenExpiry: new Date(Date.now() + 3600000),
  alertsEnabled: true,
  responseCount: 0,
  responseCountResetAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  locations: [],
};

export const TEST_LOCATION = {
  id: "loc-123",
  userId: "user-123",
  googleAccountId: "acc-123",
  googleLocationId: "loc-g-123",
  name: "Test Business",
  address: "123 Test St",
  phone: "+15551234567",
  avgRating: 4.5,
  totalReviews: 10,
  isMonitored: true,
  lastSyncedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const TEST_REVIEW = {
  id: "rev-123",
  locationId: "loc-123",
  googleReviewId: "google-rev-123",
  authorName: "Jane Doe",
  authorPhotoUrl: null,
  rating: 5,
  text: "Great service!",
  reviewDate: new Date(),
  aiDraft: "Thank you for the kind words!",
  finalResponse: null,
  respondedAt: null,
  status: "drafted",
  createdAt: new Date(),
  updatedAt: new Date(),
  location: {
    id: "loc-123",
    name: "Test Business",
    googleAccountId: "acc-123",
    googleLocationId: "loc-g-123",
    userId: "user-123",
  },
};
