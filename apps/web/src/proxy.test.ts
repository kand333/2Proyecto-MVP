import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

const request = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost:3000${path}`, cookie ? { headers: { cookie } } : undefined);

describe("proxy", () => {
  it("only runs on the private sections", () => {
    expect(config.matcher).toEqual(["/account/:path*", "/admin/:path*"]);
  });

  it("sends a visitor without a session to the login, keeping the page and its query", () => {
    const response = proxy(request("/admin/items?page=2"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fadmin%2Fitems%3Fpage%3D2",
    );
  });

  it("lets a request with a session cookie through (the layouts verify it)", () => {
    const response = proxy(request("/account", "terpenos_session=any.value"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
