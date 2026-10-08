import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken, readSessionToken, SESSION_DURATION_SECONDS } from "./session-token";

const userId = "01999999-0000-7000-8000-000000000001";
const now = Date.UTC(2026, 9, 2, 12, 0, 0);

beforeEach(() => vi.stubEnv("AUTH_SECRET", "a".repeat(40)));
afterEach(() => vi.unstubAllEnvs());

describe("session token", () => {
  it("returns the user id and the issue time (seconds) of a valid token", () => {
    expect(readSessionToken(createSessionToken(userId, now), now)).toEqual({ userId, issuedAt: now / 1000 });
  });

  it("derives the issue time of older tokens, signed before it was included", () => {
    const exp = now / 1000 + SESSION_DURATION_SECONDS;
    const payload = Buffer.from(JSON.stringify({ sub: userId, exp })).toString("base64url");
    const signature = createHmac("sha256", "a".repeat(40)).update(payload).digest("base64url");
    expect(readSessionToken(`${payload}.${signature}`, now)).toEqual({ userId, issuedAt: now / 1000 });
  });

  it("expires after the session duration", () => {
    const token = createSessionToken(userId, now);
    expect(readSessionToken(token, now + (SESSION_DURATION_SECONDS - 1) * 1000)?.userId).toBe(userId);
    expect(readSessionToken(token, now + SESSION_DURATION_SECONDS * 1000)).toBeNull();
  });

  it("rejects a token whose payload was changed", () => {
    const [, signature] = createSessionToken(userId, now).split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ sub: "another-user", exp: 9_999_999_999 })).toString("base64url");
    expect(readSessionToken(`${forgedPayload}.${signature}`, now)).toBeNull();
  });

  it("rejects a token signed with another secret", () => {
    const token = createSessionToken(userId, now);
    vi.stubEnv("AUTH_SECRET", "b".repeat(40));
    expect(readSessionToken(token, now)).toBeNull();
  });

  it.each([undefined, "", "garbage", "a.b.c", "a."])("rejects a malformed token %o", (token) => {
    expect(readSessionToken(token, now)).toBeNull();
  });

  it("refuses to work with a missing or short secret", () => {
    vi.stubEnv("AUTH_SECRET", "short");
    expect(() => createSessionToken(userId, now)).toThrow("AUTH_SECRET must have at least 32 characters");
    vi.stubEnv("AUTH_SECRET", "");
    expect(() => createSessionToken(userId, now)).toThrow("Missing required environment variable: AUTH_SECRET");
  });
});
