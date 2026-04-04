import { cookies } from "next/headers";
import { prisma } from "./db";

const SESSION_COOKIE = "reviewai_session";

/**
 * Get the current user from the session cookie.
 * Returns null if not logged in.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    include: { locations: true },
  });
}

/**
 * Get the current user ID from the session cookie.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value || null;
}

/**
 * Set the session cookie for a user.
 */
export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

/**
 * Clear the session cookie.
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Find or create a user by email.
 */
export async function findOrCreateUser(email: string) {
  const normalized = email.toLowerCase().trim();
  let user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) {
    user = await prisma.user.create({ data: { email: normalized } });
  }
  return user;
}

/**
 * Get the tier limits for location count.
 */
export function getLocationLimit(tier: string): number {
  switch (tier) {
    case "business":
      return 5;
    case "pro":
      return 1;
    default:
      return 0; // free users can't monitor locations
  }
}
