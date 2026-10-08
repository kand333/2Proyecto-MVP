import type { AdminUserSummary } from "@portal/shared/admin-user";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAdminUsersApiPath,
  createUser,
  deleteUser,
  diffUserChanges,
  parseAdminUserListParams,
  toAdminUserListQuery,
  updateUser,
} from "./admin-users";

afterEach(() => vi.unstubAllGlobals());

describe("admin user list params", () => {
  it("reads page, search, role and status, dropping invalid values", () => {
    expect(parseAdminUserListParams({ page: "2", search: " ana ", role: "ADMIN", status: "inactive" })).toEqual({
      page: 2,
      search: "ana",
      role: "ADMIN",
      status: "inactive",
    });
    expect(parseAdminUserListParams({ page: "x", role: "OWNER", status: "banned" })).toEqual({
      page: 1,
      search: "",
      role: undefined,
      status: undefined,
    });
  });

  it("builds the page query without the defaults, and asks the API for 10 per page", () => {
    expect(toAdminUserListQuery({ page: 1, search: "" }).toString()).toBe("");
    expect(buildAdminUsersApiPath({ page: 1, search: "" })).toBe("/api/admin/users?pageSize=10");
    expect(buildAdminUsersApiPath({ page: 3, search: "ana", role: "USER", status: "active" })).toBe(
      "/api/admin/users?search=ana&role=USER&status=active&page=3&pageSize=10",
    );
  });
});

describe("diffUserChanges", () => {
  const user: AdminUserSummary = {
    id: "u1",
    name: "Ana",
    email: "ana@test.com",
    role: "USER",
    isActive: true,
    isOnline: false,
    lastSeenAt: null,
    createdAt: "2026-09-01T00:00:00.000Z",
  };
  const same = { name: "Ana", email: "ana@test.com", password: "", role: "USER" as const, isActive: true };

  it("returns nothing when nothing changed (spaces and email case do not count)", () => {
    expect(diffUserChanges(user, { ...same, name: " Ana ", email: "ANA@test.com " })).toEqual({});
  });

  it("returns only the changed fields; an empty password keeps the current one", () => {
    expect(diffUserChanges(user, { ...same, name: "Ana María", role: "ADMIN", password: "nueva-clave-1" })).toEqual({
      name: "Ana María",
      role: "ADMIN",
      password: "nueva-clave-1",
    });
    expect(diffUserChanges(user, { ...same, isActive: false })).toEqual({ isActive: false });
  });
});

describe("user requests", () => {
  it("creates, edits and deletes through the admin API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ id: "u1" }, { status: 201 }))
      .mockResolvedValueOnce(Response.json({ id: "u1" }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await createUser({ name: "Ana", email: "ana@test.com", password: "clave-segura-1", role: "USER" });
    await updateUser("u1", { isActive: false });
    await deleteUser("u1");
    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ["/api/admin/users", "POST"],
      ["/api/admin/users/u1", "PATCH"],
      ["/api/admin/users/u1", "DELETE"],
    ]);
  });
});
