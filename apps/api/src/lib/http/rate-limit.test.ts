import { beforeEach, describe, expect, it } from "vitest";
import { clientIp, resetRateLimits, takeRequest, type RateLimitRule } from "./rate-limit";

const rule: RateLimitRule = { name: "test", limit: 3, windowMs: 60_000, message: "Demasiadas" };

beforeEach(() => resetRateLimits());

describe("takeRequest", () => {
  it("allows up to the limit in a window, then says how long to wait", () => {
    for (let index = 0; index < 3; index += 1) expect(takeRequest(rule, "a", 1_000)).toBeNull();
    expect(takeRequest(rule, "a", 31_000)).toBe(30);
  });

  it("starts again when the window ends, and counts each client and rule apart", () => {
    for (let index = 0; index < 3; index += 1) takeRequest(rule, "a", 0);
    expect(takeRequest(rule, "a", 60_000)).toBeNull();
    expect(takeRequest(rule, "b", 1)).toBeNull();
    expect(takeRequest({ ...rule, name: "other" }, "a", 1)).toBeNull();
  });
});

describe("clientIp", () => {
  const request = (headers: Record<string, string>) => new Request("http://localhost/api", { headers });

  it("takes the first x-forwarded-for entry, then x-real-ip", () => {
    expect(clientIp(request({ "x-forwarded-for": " 203.0.113.7 , 10.0.0.1" }))).toBe("203.0.113.7");
    expect(clientIp(request({ "x-real-ip": "198.51.100.9" }))).toBe("198.51.100.9");
    expect(clientIp(request({}))).toBe("unknown");
  });
});
