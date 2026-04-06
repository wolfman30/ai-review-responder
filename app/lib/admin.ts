import { NextRequest } from "next/server";

export function isAdminRequest(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
  const adminKey = request.headers.get("x-admin-key");

  return bearerToken === secret || adminKey === secret;
}
