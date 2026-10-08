import { describe, expect, it } from "vitest";
import { clearFailedLogins, isLoginBlocked, recordFailedLogin } from "./login-rate-limit";

const minute = 60 * 1000;

describe("login rate limit", () => {
  it("blocks an email after 5 failed attempts within 15 minutes", () => {
    const email = "blocked@example.com";
    for (let attempt = 0; attempt < 4; attempt += 1) recordFailedLogin(email, attempt * minute);
    expect(isLoginBlocked(email, 4 * minute)).toBe(false);
    recordFailedLogin(email, 4 * minute);
    expect(isLoginBlocked(email, 4 * minute)).toBe(true);
  });

  it("unblocks when the 15-minute window ends", () => {
    const email = "window@example.com";
    for (let attempt = 0; attempt < 10; attempt += 1) recordFailedLogin(email, 0);
    expect(isLoginBlocked(email, 14 * minute)).toBe(true);
    expect(isLoginBlocked(email, 15 * minute)).toBe(false);
  });

  it("forgets the failures after a successful login", () => {
    const email = "cleared@example.com";
    for (let attempt = 0; attempt < 10; attempt += 1) recordFailedLogin(email, 0);
    clearFailedLogins(email);
    expect(isLoginBlocked(email, 0)).toBe(false);
  });

  it("counts each email separately", () => {
    for (let attempt = 0; attempt < 10; attempt += 1) recordFailedLogin("one@example.com", 0);
    expect(isLoginBlocked("two@example.com", 0)).toBe(false);
  });
});
