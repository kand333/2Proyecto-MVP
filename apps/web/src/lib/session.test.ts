import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithSession, findWithSession, getAdminUser, requireCustomerUser, getSessionUser, requireSessionUser } from "./session";

const { cookieStore, redirectMock } = vi.hoisted(() => ({
  cookieStore: { value: undefined as string | undefined },
  redirectMock: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "terpenex_session" && cookieStore.value ? { value: cookieStore.value } : undefined),
  }),
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
// React's cache() only memoizes inside a server render; here every call runs.
vi.mock("react", async (importOriginal) => ({ ...(await importOriginal<typeof import("react")>()), cache: <T>(fn: T) => fn }));

const user = { id: "u1", name: "Ana", email: "ana@test.com", role: "USER", isActive: true };

beforeEach(() => {
  cookieStore.value = undefined;
  vi.stubEnv("API_INTERNAL_URL", "http://api.test");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  redirectMock.mockClear();
});

describe("getSessionUser", () => {
  it("returns null without a session cookie, without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(getSessionUser()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks the API for the user, forwarding the session cookie and skipping caches", async () => {
    cookieStore.value = "signed.token";
    const fetchMock = vi.fn().mockResolvedValue(Response.json(user));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSessionUser()).resolves.toEqual(user);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/api/auth/me",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({ Cookie: "terpenex_session=signed.token" }),
      }),
    );
  });

  it("returns null when the API rejects the session (expired, forged, deactivated)", async () => {
    cookieStore.value = "expired.token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: 401 }, { status: 401 })));
    await expect(getSessionUser()).resolves.toBeNull();
  });

  it("throws when the API fails, instead of treating the user as logged out", async () => {
    cookieStore.value = "signed.token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("down", { status: 503 })));
    await expect(getSessionUser()).rejects.toThrow("HTTP 503");
  });
});

describe("requireSessionUser", () => {
  it("returns the user when there is a session", async () => {
    cookieStore.value = "signed.token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(user)));
    await expect(requireSessionUser("/account")).resolves.toEqual(user);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("sends visitors to the login, keeping the page to return to", async () => {
    await expect(requireSessionUser("/account")).rejects.toThrow("NEXT_REDIRECT /login?next=%2Faccount");
  });
});

describe("requireCustomerUser", () => {
  it("returns a USER", async () => {
    cookieStore.value = "signed.token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(user)));
    await expect(requireCustomerUser("/account")).resolves.toEqual(user);
  });

  it("sends an ADMIN to its own area, to /admin unless told otherwise", async () => {
    cookieStore.value = "signed.token";
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => Response.json({ ...user, role: "ADMIN" })));
    await expect(requireCustomerUser("/account")).rejects.toThrow("NEXT_REDIRECT /admin");
    await expect(requireCustomerUser("/account/edit", "/admin/account")).rejects.toThrow("NEXT_REDIRECT /admin/account");
  });

  it("sends visitors to the login", async () => {
    await expect(requireCustomerUser("/account")).rejects.toThrow("NEXT_REDIRECT /login?next=%2Faccount");
  });
});

describe("getAdminUser", () => {
  it("returns the user when it is an ADMIN", async () => {
    cookieStore.value = "signed.token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ...user, role: "ADMIN" })));
    await expect(getAdminUser("/admin")).resolves.toMatchObject({ role: "ADMIN" });
  });

  it("returns null for a USER", async () => {
    cookieStore.value = "signed.token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(user)));
    await expect(getAdminUser("/admin")).resolves.toBeNull();
  });

  it("sends visitors to the login", async () => {
    await expect(getAdminUser("/admin")).rejects.toThrow("NEXT_REDIRECT /login?next=%2Fadmin");
  });
});

describe("fetchWithSession", () => {
  it("forwards the session cookie to the API and returns the JSON", async () => {
    cookieStore.value = "signed.token";
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ users: 4 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWithSession("/api/admin/dashboard")).resolves.toEqual({ users: 4 });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/api/admin/dashboard",
      expect.objectContaining({ cache: "no-store", headers: expect.objectContaining({ Cookie: "terpenex_session=signed.token" }) }),
    );
  });

  it("throws on an error answer", async () => {
    cookieStore.value = "signed.token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: 403 }, { status: 403 })));
    await expect(fetchWithSession("/api/admin/dashboard")).rejects.toThrow("HTTP 403");
  });
});

describe("findWithSession", () => {
  it("returns the JSON, or null when the resource does not exist", async () => {
    cookieStore.value = "signed.token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ id: "p1" })));
    await expect(findWithSession("/api/admin/items/p1")).resolves.toEqual({ id: "p1" });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: 404 }, { status: 404 })));
    await expect(findWithSession("/api/admin/items/p2")).resolves.toBeNull();
  });

  it("throws on any other error answer", async () => {
    cookieStore.value = "signed.token";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: 500 }, { status: 500 })));
    await expect(findWithSession("/api/admin/items/p1")).rejects.toThrow("HTTP 500");
  });
});
