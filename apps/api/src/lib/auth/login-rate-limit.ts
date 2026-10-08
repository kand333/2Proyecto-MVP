import "server-only";

export const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MILLISECONDS = 15 * 60 * 1000;

type Attempts = { count: number; windowStart: number };

/**
 * Failed logins per email, to slow down password guessing.
 * ponytail: in-memory and per server process; with several instances, move it to the database or
 * a shared store.
 */
const failedAttempts = new Map<string, Attempts>();

function currentAttempts(email: string, now: number): Attempts | undefined {
  const attempts = failedAttempts.get(email);
  if (attempts && now - attempts.windowStart >= WINDOW_MILLISECONDS) {
    failedAttempts.delete(email);
    return undefined;
  }
  return attempts;
}

export function isLoginBlocked(email: string, now = Date.now()): boolean {
  return (currentAttempts(email, now)?.count ?? 0) >= MAX_FAILED_ATTEMPTS;
}

export function recordFailedLogin(email: string, now = Date.now()): void {
  const attempts = currentAttempts(email, now);
  failedAttempts.set(email, attempts ? { ...attempts, count: attempts.count + 1 } : { count: 1, windowStart: now });
}

export function clearFailedLogins(email: string): void {
  failedAttempts.delete(email);
}
