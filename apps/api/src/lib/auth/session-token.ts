import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getRequiredEnvironmentVariable } from "@/lib/environment";

export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const MIN_SECRET_LENGTH = 32;

type SessionPayload = {
  /** User id. */
  sub: string;
  /** Issue time, in seconds since the epoch (lets a password change revoke older sessions). */
  iat: number;
  /** Expiration, in seconds since the epoch. */
  exp: number;
};

/** A valid session: whose it is and when it was issued (seconds since the epoch). */
export type Session = { userId: string; issuedAt: number };

function getSecret(): string {
  const secret = getRequiredEnvironmentVariable("AUTH_SECRET");
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`AUTH_SECRET must have at least ${MIN_SECRET_LENGTH} characters`);
  }
  return secret;
}

const sign = (encodedPayload: string, secret: string) =>
  createHmac("sha256", secret).update(encodedPayload).digest("base64url");

/**
 * Session token "payload.signature": the user id and expiration, signed with HMAC-SHA256 and the
 * server secret. It travels only in an httpOnly cookie, never in storage the page can read.
 */
export function createSessionToken(userId: string, now = Date.now()): string {
  const issuedAt = Math.floor(now / 1000);
  const payload: SessionPayload = { sub: userId, iat: issuedAt, exp: issuedAt + SESSION_DURATION_SECONDS };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload, getSecret())}`;
}

/** Returns the session of a valid, unexpired token, or null for anything else. */
export function readSessionToken(token: string | undefined, now = Date.now()): Session | null {
  if (!token) return null;
  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(encodedPayload, getSecret()));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp <= Math.floor(now / 1000)) return null;
    // Tokens issued before `iat` existed: their issue time follows from the fixed duration.
    const issuedAt = typeof payload.iat === "number" ? payload.iat : payload.exp - SESSION_DURATION_SECONDS;
    return { userId: payload.sub, issuedAt };
  } catch {
    return null;
  }
}
