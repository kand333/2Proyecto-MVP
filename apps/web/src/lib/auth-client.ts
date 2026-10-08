import type { AuthUser, ChangePasswordData, LoginData, RegisterData, UpdateProfileData } from "@portal/shared/auth";
import { mutate } from "swr";
import { ApiClientError, fetchJson, postJson, sendJson } from "./api-client";
import { flash } from "./flash";

export const CURRENT_USER_KEY = "/api/auth/me";

/** The session user, or null when there is no session (401). Other errors are thrown. */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    return await fetchJson<AuthUser>(CURRENT_USER_KEY);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) return null;
    throw error;
  }
}

/** Creates the account; the API also starts the session (httpOnly cookie). */
export async function registerAccount(data: RegisterData): Promise<AuthUser> {
  const user = await postJson<AuthUser>("/api/auth/register", data);
  await mutate(CURRENT_USER_KEY, user, { revalidate: false });
  flash(`Cuenta creada. Te damos la bienvenida, ${user.name}.`);
  return user;
}

export async function logIn(data: LoginData): Promise<AuthUser> {
  const user = await postJson<AuthUser>("/api/auth/login", data);
  await mutate(CURRENT_USER_KEY, user, { revalidate: false });
  flash(`Sesión iniciada. ¡Hola, ${user.name}!`);
  return user;
}

export async function logOut(): Promise<void> {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  if (!response.ok) throw new ApiClientError(response.status, "No pudimos cerrar la sesión");
  await mutate(CURRENT_USER_KEY, null, { revalidate: false });
  flash("Sesión cerrada.");
}

/** Saves name and email (the current password is needed only to change the email). */
export async function updateProfile(data: UpdateProfileData): Promise<AuthUser> {
  const user = await sendJson<AuthUser>("PATCH", "/api/account/profile", data);
  await mutate(CURRENT_USER_KEY, user, { revalidate: false });
  return user;
}

export function changePassword(data: ChangePasswordData): Promise<void> {
  return sendJson<void>("PUT", "/api/account/password", data);
}

const SAME_ORIGIN_BASE = "http://same-origin.invalid";

/**
 * Where to go after logging in: the `next` path of the URL when it is a page of this site,
 * otherwise the home page. Blocks open redirects such as "//evil.com" or "https://…". The path is
 * resolved the way the browser will (it drops tabs and newlines and reads a backslash as "/"), so
 * a "/" + tab + "/evil.com" path cannot turn into "//evil.com" after this check.
 */
export function getSafeRedirectPath(next: string | null): string {
  if (!next?.startsWith("/")) return "/";
  try {
    const url = new URL(next, SAME_ORIGIN_BASE);
    return url.origin === SAME_ORIGIN_BASE ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}
