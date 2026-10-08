import "server-only";
import { errorResponse } from "@/lib/http/api-error";

export type RateLimitRule = {
  /** Name of the bucket: each rule counts separately. */
  name: string;
  /** Requests allowed per window and client. */
  limit: number;
  windowMs: number;
  message: string;
};

/** Public endpoints that write: limits per client IP, to slow down guessing and spam. */
export const RATE_LIMITS = {
  // Many emails from one client (the per-email limit of 5 failures covers a single account).
  login: { name: "login", limit: 20, windowMs: 15 * 60 * 1000, message: "Demasiados intentos de ingreso. Espera unos minutos e inténtalo de nuevo." },
  register: { name: "register", limit: 5, windowMs: 60 * 60 * 1000, message: "Demasiados registros desde esta conexión. Inténtalo más tarde." },
} satisfies Record<string, RateLimitRule>;

type Window = { count: number; start: number };

/**
 * Fixed windows per rule and client.
 * ponytail: in memory and per server process; with several instances, use a shared store
 * (or the platform's limiter).
 */
const windows = new Map<string, Window>();

/**
 * Client IP: the first `x-forwarded-for` entry, which the web proxy sets from the connection
 * when the request does not bring one. A client can send its own value, so this limit only
 * slows abuse down; the per-email login limit does not depend on it.
 */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Counts one request; returns the seconds to wait when the client is over the limit, or null. */
export function takeRequest(rule: RateLimitRule, client: string, now = Date.now()): number | null {
  const key = `${rule.name}:${client}`;
  const current = windows.get(key);
  const window = current && now - current.start < rule.windowMs ? current : { count: 0, start: now };
  if (window.count >= rule.limit) return Math.max(1, Math.ceil((window.start + rule.windowMs - now) / 1000));
  windows.set(key, { ...window, count: window.count + 1 });
  return null;
}

/** 429 with `Retry-After` when the request goes over the rule's limit; null when it may go on. */
export function rateLimit(request: Request, rule: RateLimitRule): Response | null {
  const retryAfter = takeRequest(rule, clientIp(request));
  if (retryAfter === null) return null;
  const response = errorResponse(429, rule.message);
  response.headers.set("Retry-After", String(retryAfter));
  return response;
}

/** Tests only: start every window from zero. */
export function resetRateLimits(): void {
  windows.clear();
}
