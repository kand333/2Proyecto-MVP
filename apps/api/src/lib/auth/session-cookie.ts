import "server-only";
import { SESSION_COOKIE_NAME } from "@portal/shared/app-config";
import type { NextRequest, NextResponse } from "next/server";
import { createSessionToken, readSessionToken, SESSION_DURATION_SECONDS, type Session } from "./session-token";

export { SESSION_COOKIE_NAME };

const cookieOptions = {
  // Unreadable from JavaScript, sent only to this site (SameSite=Lax blocks cross-site POSTs).
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setSessionCookie(response: NextResponse, userId: string): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(userId), {
    ...cookieOptions,
    maxAge: SESSION_DURATION_SECONDS,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
  return response;
}

/** The session of the cookie, or null when there is none or it is invalid or expired. */
export function readSession(request: NextRequest): Session | null {
  return readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

/** User id of the session cookie, or null when there is none or it is invalid or expired. */
export function readSessionUserId(request: NextRequest): string | null {
  return readSession(request)?.userId ?? null;
}
