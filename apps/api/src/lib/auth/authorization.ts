import "server-only";
import type { NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session-cookie";
import { ApiError } from "@/lib/http/api-error";
import { getActiveUser } from "@/services/auth-service";
import type { AuthUser } from "@portal/shared/auth";
import type { UserRole } from "@portal/shared/enums";

/**
 * Backend authorization. Every protected Route Handler calls one of these first: they read the
 * session cookie and load the user from the database on each request, so a deactivated account or
 * a changed role takes effect immediately.
 */

/** For public endpoints that behave differently with a session: the active user, or null. Never throws 401. */
export async function getOptionalUser(request: NextRequest): Promise<AuthUser | null> {
  const session = readSession(request);
  return session ? getActiveUser(session) : null;
}

/** The authenticated, active user; otherwise 401. */
export async function requireUser(request: NextRequest): Promise<AuthUser> {
  const session = readSession(request);
  const user = session ? await getActiveUser(session) : null;
  if (!user) throw new ApiError(401, "Debes iniciar sesión");
  return user;
}

/** The authenticated user when it has one of the roles; 401 without a session, 403 otherwise. */
export async function requireRole(request: NextRequest, roles: readonly UserRole[]): Promise<AuthUser> {
  const user = await requireUser(request);
  if (!roles.includes(user.role)) throw new ApiError(403, "No tienes permisos para realizar esta acción");
  return user;
}

/** ADMIN only: 401 without a session, 403 for a USER. */
export function requireAdmin(request: NextRequest): Promise<AuthUser> {
  return requireRole(request, ["ADMIN"]);
}
