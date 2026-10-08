import type { AuthUser } from "@portal/shared/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { apiInternalUrl } from "./api-internal-url";
import { SESSION_COOKIE_NAME } from "./session-cookie";

/**
 * The logged-in user, for Server Components. The frontend cannot verify the session itself (the
 * signing secret lives only in the API), so it asks `GET /api/auth/me`, forwarding the cookie.
 * Cached per request: layout and page share one call.
 */
export const getSessionUser = cache(async (): Promise<AuthUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const response = await fetch(`${apiInternalUrl()}/api/auth/me`, {
    headers: { Accept: "application/json", Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`No fue posible verificar la sesión (HTTP ${response.status})`);
  return response.json() as Promise<AuthUser>;
});

async function getWithSession(path: string): Promise<Response> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return fetch(`${apiInternalUrl()}${path}`, {
    headers: { Accept: "application/json", ...(token ? { Cookie: `${SESSION_COOKIE_NAME}=${token}` } : {}) },
    cache: "no-store",
  });
}

/**
 * GETs a private REST resource from a Server Component, forwarding the session cookie.
 * Throws on any non-2xx answer (the page has already checked the session and the role).
 */
export async function fetchWithSession<Data>(path: string): Promise<Data> {
  const response = await getWithSession(path);
  if (!response.ok) throw new Error(`No fue posible cargar la información (HTTP ${response.status})`);
  return response.json() as Promise<Data>;
}

/** Like `fetchWithSession`, but a 404 answer means the resource does not exist: returns null. */
export async function findWithSession<Data>(path: string): Promise<Data | null> {
  const response = await getWithSession(path);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`No fue posible cargar la información (HTTP ${response.status})`);
  return response.json() as Promise<Data>;
}

/** For pages that need a session: sends visitors to the login, which returns them here afterwards. */
export async function requireSessionUser(returnPath: string): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?${new URLSearchParams({ next: returnPath })}`);
  return user;
}

/**
 * For the USER area (/account/**): visitors go to the login and an ADMIN goes to its own area,
 * since the user sections are not for administrators (they have /admin/account).
 */
export async function requireCustomerUser(returnPath: string, adminDestination = "/admin"): Promise<AuthUser> {
  const user = await requireSessionUser(returnPath);
  if (user.role === "ADMIN") redirect(adminDestination);
  return user;
}

/**
 * For ADMIN pages: visitors go to the login; returns null for a logged-in user without the role.
 * Call it in every admin page, not only in the layout: Next renders layout and page in parallel,
 * so a layout check alone does not keep the page content out of the response.
 */
export async function getAdminUser(returnPath: string): Promise<AuthUser | null> {
  const user = await requireSessionUser(returnPath);
  return user.role === "ADMIN" ? user : null;
}
