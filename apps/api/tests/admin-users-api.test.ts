import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AdminUserSummary } from "@portal/shared/admin-user";
import type { PaginatedResponse } from "@portal/shared/pagination";

// Integration test: ADMIN user management, against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const origin = "http://localhost:3000/api";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function createAccount(label: string, role: "USER" | "ADMIN" = "USER", isActive = true) {
  const prisma = await getPrisma();
  const user = await prisma.user.create({
    data: { name: `${label} ${testRunId}`, email: `${label.toLowerCase()}-${testRunId}@example.com`, passwordHash: "scrypt$not-used-here", role, isActive },
  });
  const { createSessionToken } = await import("@/lib/auth/session-token");
  return { id: user.id, cookie: `terpenos_session=${createSessionToken(user.id)}` };
}

const request = (path: string, method: string, cookie?: string, body?: unknown) =>
  new NextRequest(`${origin}${path}`, {
    method,
    headers: { ...(cookie ? { cookie } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const read = async (response: Response) => ({ status: response.status, body: await response.json() });

async function list(query: string, cookie?: string) {
  const { GET } = await import("@/app/api/admin/users/route");
  return read(await GET(request(`/admin/users${query}`, "GET", cookie)));
}

async function update(id: string, body: unknown, cookie?: string) {
  const { PATCH } = await import("@/app/api/admin/users/[id]/route");
  return read(await PATCH(request(`/admin/users/${id}`, "PATCH", cookie, body), { params: Promise.resolve({ id }) }));
}

async function create(body: unknown, cookie?: string) {
  const { POST } = await import("@/app/api/admin/users/route");
  return read(await POST(request("/admin/users", "POST", cookie, body)));
}

async function remove(id: string, cookie?: string) {
  const { DELETE } = await import("@/app/api/admin/users/[id]/route");
  const response = await DELETE(request(`/admin/users/${id}`, "DELETE", cookie), { params: Promise.resolve({ id }) });
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}

async function login(email: string, password: string) {
  const { POST } = await import("@/app/api/auth/login/route");
  return (await POST(request("/auth/login", "POST", undefined, { email, password }))).status;
}

async function me(cookie: string) {
  const { GET } = await import("@/app/api/auth/me/route");
  return (await GET(request("/auth/me", "GET", cookie))).status;
}

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("admin users API", () => {
  let admin: { id: string; cookie: string };
  let ana: { id: string; cookie: string };
  let luis: { id: string; cookie: string };

  beforeAll(async () => {
    admin = await createAccount("Jefa", "ADMIN");
    ana = await createAccount("Ana");
    luis = await createAccount("Luis", "USER", false);
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("is for ADMIN only", async () => {
    for (const [cookie, status] of [
      [undefined, 401],
      [ana.cookie, 403],
    ] as const) {
      expect((await list("", cookie)).status).toBe(status);
      expect((await update(luis.id, { isActive: true }, cookie)).status).toBe(status);
    }
  });

  it("lists and searches by name or email, with role and status filters", async () => {
    const page = (await list(`?search=${testRunId}`, admin.cookie)).body as PaginatedResponse<AdminUserSummary>;
    expect(page.meta.total).toBe(3);
    expect(page.data[0]).toMatchObject({ createdAt: expect.any(String) });

    const names = async (query: string) =>
      ((await list(`?search=${testRunId}${query}`, admin.cookie)).body as PaginatedResponse<AdminUserSummary>).data.map((user) => user.name);
    expect(await names("&role=ADMIN")).toEqual([`Jefa ${testRunId}`]);
    expect(await names("&status=inactive")).toEqual([`Luis ${testRunId}`]);
    expect(await names(" ANA")).toEqual([`Ana ${testRunId}`]);
    expect(((await list(`?search=ana-${testRunId}@example`, admin.cookie)).body as PaginatedResponse<AdminUserSummary>).meta.total).toBe(1);
    expect((await list("?role=OWNER", admin.cookie)).status).toBe(400);
  });

  it("lists the viewer first, then the users online now, then the rest; logging out goes offline", async () => {
    const prisma = await getPrisma();
    const summaries = async (cookie = admin.cookie) =>
      ((await list(`?search=${testRunId}`, cookie)).body as PaginatedResponse<AdminUserSummary>).data.map(
        (user) => `${user.name.split(" ")[0]}:${user.isOnline ? "online" : "offline"}`,
      );
    await prisma.user.updateMany({ where: { email: { contains: testRunId } }, data: { lastSeenAt: null } });

    // Nobody else online: the viewer, then the rest (newest first: Luis was created after Ana).
    expect(await summaries()).toEqual(["Jefa:online", "Luis:offline", "Ana:offline"]);

    expect(await me(ana.cookie)).toBe(200); // Any authenticated request marks the user online.
    expect(await summaries()).toEqual(["Jefa:online", "Ana:online", "Luis:offline"]);

    // Another administrator sees themself first.
    const otherAdmin = await createAccount("Otra", "ADMIN");
    expect((await summaries(otherAdmin.cookie))[0]).toBe("Otra:online");

    const { POST } = await import("@/app/api/auth/logout/route");
    expect((await POST(request("/auth/logout", "POST", ana.cookie))).status).toBe(204);
    expect(await summaries()).toEqual(["Jefa:online", "Otra:online", "Luis:offline", "Ana:offline"]);
    // Offline, but the last connection is kept (Luis never connected).
    const lastSeen = async (name: string) =>
      ((await list(`?search=${name}-${testRunId}`, admin.cookie)).body as PaginatedResponse<AdminUserSummary>).data[0]?.lastSeenAt;
    expect(Date.parse((await lastSeen("ana")) ?? "")).toBeGreaterThan(Date.now() - 60_000);
    expect(await lastSeen("luis")).toBeNull();
    // Logging back in (any request with a session) shows as online at once, even within the same minute.
    expect(await me(ana.cookie)).toBe(200);
    expect((await summaries()).slice(0, 2)).toEqual(["Jefa:online", "Ana:online"]);
    await POST(request("/auth/logout", "POST", ana.cookie));

    // Seen more than five minutes ago: offline again.
    await prisma.user.update({ where: { id: otherAdmin.id }, data: { lastSeenAt: new Date(Date.now() - 6 * 60 * 1000) } });
    expect(await summaries()).toEqual(["Jefa:online", "Otra:offline", "Luis:offline", "Ana:offline"]);
    await prisma.user.delete({ where: { id: otherAdmin.id } });
  });

  it("cuts pages across the groups (viewer, online, rest)", async () => {
    const pageOf = async (page: number) =>
      ((await list(`?search=${testRunId}&pageSize=1&page=${page}`, admin.cookie)).body as PaginatedResponse<AdminUserSummary>).data.map(
        (user) => user.name.split(" ")[0],
      );
    expect(await me(ana.cookie)).toBe(200);
    expect([await pageOf(1), await pageOf(2), await pageOf(3), await pageOf(4)]).toEqual([["Jefa"], ["Ana"], ["Luis"], []]);
  });

  it("deactivates a user: their session stops working at once; activating restores it", async () => {
    expect(await me(ana.cookie)).toBe(200);
    expect((await update(ana.id, { isActive: false }, admin.cookie)).body).toMatchObject({ id: ana.id, isActive: false });
    expect(await me(ana.cookie)).toBe(401);

    await update(ana.id, { isActive: true }, admin.cookie);
    expect(await me(ana.cookie)).toBe(200);
  });

  it("changes the role: the new permissions apply on the next request", async () => {
    const { GET } = await import("@/app/api/admin/dashboard/route");
    const dashboard = async () => (await GET(request("/admin/dashboard", "GET", ana.cookie))).status;

    expect(await dashboard()).toBe(403);
    expect((await update(ana.id, { role: "ADMIN" }, admin.cookie)).body).toMatchObject({ role: "ADMIN" });
    expect(await dashboard()).toBe(200);
    await update(ana.id, { role: "USER" }, admin.cookie);
    expect(await dashboard()).toBe(403);
  });

  it("does not let an administrator change or delete their own account", async () => {
    expect(await update(admin.id, { isActive: false }, admin.cookie)).toEqual({
      status: 409,
      body: { message: "Tu propia cuenta se administra en «Mi cuenta»", status: 409 },
    });
    expect((await update(admin.id, { role: "USER" }, admin.cookie)).status).toBe(409);
    expect((await update(admin.id, { name: "Otro nombre" }, admin.cookie)).status).toBe(409);
    expect(await remove(admin.id, admin.cookie)).toEqual({
      status: 409,
      body: { message: "No puedes eliminar tu propia cuenta", status: 409 },
    });
  });

  it("creates accounts with the registration rules, refusing a used email", async () => {
    const created = await create({ name: "Creado", email: ` CREADO-${testRunId}@Example.com `, password: "clave-segura-1", role: "ADMIN" }, admin.cookie);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: "Creado", email: `creado-${testRunId}@example.com`, role: "ADMIN", isActive: true });
    expect(await login(`creado-${testRunId}@example.com`, "clave-segura-1")).toBe(200);

    expect((await create({ name: "Otro", email: `creado-${testRunId}@example.com`, password: "clave-segura-1" }, admin.cookie)).body).toEqual({
      message: "Ya existe una cuenta con este email",
      status: 409,
    });
    expect((await create({ name: "Otro", email: "x@example.com", password: "corta" }, admin.cookie)).status).toBe(400);
    expect((await create({ name: "Otro", email: "y@example.com", password: "clave-segura-1" }, ana.cookie)).status).toBe(403);
  });

  it("edits a user's name, email and password", async () => {
    const { body } = await create({ name: "Editable", email: `editable-${testRunId}@example.com`, password: "clave-original-1" }, admin.cookie);
    const id = (body as AdminUserSummary).id;
    const { createSessionToken } = await import("@/lib/auth/session-token");
    const openSession = `terpenos_session=${createSessionToken(id, Date.now() - 60_000)}`;
    expect(await me(openSession)).toBe(200);

    const edited = await update(id, { name: "Editado", email: `editado-${testRunId}@example.com`, password: "clave-nueva-123" }, admin.cookie);
    // A new password logs the user out of the sessions they had open.
    expect(await me(openSession)).toBe(401);
    expect(edited.body).toMatchObject({ name: "Editado", email: `editado-${testRunId}@example.com` });
    expect(await login(`editado-${testRunId}@example.com`, "clave-nueva-123")).toBe(200);
    expect(await login(`editado-${testRunId}@example.com`, "clave-original-1")).toBe(401);
    // An email that another account uses.
    expect((await update(id, { email: `ana-${testRunId}@example.com` }, admin.cookie)).status).toBe(409);
  });

  it("deletes a user for good", async () => {
    const prisma = await getPrisma();
    const { body } = await create({ name: "Borrable", email: `borrable-${testRunId}@example.com`, password: "clave-segura-1" }, admin.cookie);
    const id = (body as AdminUserSummary).id;

    expect((await remove(id, admin.cookie)).status).toBe(204);
    expect(await prisma.user.count({ where: { id } })).toBe(0);
    expect((await remove(id, admin.cookie)).status).toBe(404);
    expect((await remove(luis.id, ana.cookie)).status).toBe(403);
  });

  it("validates the change and the id", async () => {
    expect(await update(luis.id, {}, admin.cookie)).toEqual({
      status: 400,
      body: { message: "Indica qué cambiar", status: 400 },
    });
    expect((await update(randomUUID(), { isActive: true }, admin.cookie)).status).toBe(404);
    expect((await update("x", { isActive: true }, admin.cookie)).status).toBe(400);
  });
});
