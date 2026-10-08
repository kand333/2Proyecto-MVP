import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Item } from "@portal/shared/item";
import type { PaginatedResponse } from "@portal/shared/pagination";

// Integration test: ADMIN management of the example Item module, against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const origin = "http://localhost:3000/api";
const missingId = "00000000-0000-4000-8000-000000000000";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function sessionCookieFor(role: "USER" | "ADMIN") {
  const prisma = await getPrisma();
  const user = await prisma.user.create({
    data: { name: role, email: `${role.toLowerCase()}-items-${testRunId}@example.com`, passwordHash: "scrypt$not-used-here", role },
  });
  const { createSessionToken } = await import("@/lib/auth/session-token");
  return `starter_session=${createSessionToken(user.id)}`;
}

const request = (path: string, method: string, cookie?: string, body?: unknown) =>
  new NextRequest(`${origin}${path}`, {
    method,
    headers: { ...(cookie ? { cookie } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const read = async (response: Response) => ({ status: response.status, body: response.status === 204 ? null : await response.json() });
const context = (id: string) => ({ params: Promise.resolve({ id }) });

async function list(query: string, cookie?: string) {
  const { GET } = await import("@/app/api/admin/items/route");
  return read(await GET(request(`/admin/items${query}`, "GET", cookie)));
}

async function create(body: unknown, cookie?: string) {
  const { POST } = await import("@/app/api/admin/items/route");
  return read(await POST(request("/admin/items", "POST", cookie, body)));
}

async function get(id: string, cookie?: string) {
  const { GET } = await import("@/app/api/admin/items/[id]/route");
  return read(await GET(request(`/admin/items/${id}`, "GET", cookie), context(id)));
}

async function update(id: string, body: unknown, cookie?: string) {
  const { PATCH } = await import("@/app/api/admin/items/[id]/route");
  return read(await PATCH(request(`/admin/items/${id}`, "PATCH", cookie, body), context(id)));
}

async function remove(id: string, cookie?: string) {
  const { DELETE } = await import("@/app/api/admin/items/[id]/route");
  return read(await DELETE(request(`/admin/items/${id}`, "DELETE", cookie), context(id)));
}

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("admin items API", () => {
  let adminCookie: string;
  let userCookie: string;

  beforeAll(async () => {
    adminCookie = await sessionCookieFor("ADMIN");
    userCookie = await sessionCookieFor("USER");
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.item.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("answers 401 without a session and 403 to a USER", async () => {
    expect((await list("")).status).toBe(401);
    expect((await create({ title: "x" }, userCookie)).status).toBe(403);
    expect((await remove(missingId, userCookie)).status).toBe(403);
  });

  it("creates, reads, changes and deletes an item", async () => {
    const created = await create({ title: `  Draft ${testRunId} `, description: "Texto" }, adminCookie);
    expect(created.status).toBe(201);
    const item = created.body as Item;
    expect(item).toMatchObject({ title: `Draft ${testRunId}`, description: "Texto", isPublished: false });

    expect(await get(item.id, adminCookie)).toEqual({ status: 200, body: item });

    const changed = await update(item.id, { isPublished: true }, adminCookie);
    expect(changed.status).toBe(200);
    expect(changed.body).toMatchObject({ id: item.id, title: item.title, isPublished: true });

    expect((await remove(item.id, adminCookie)).status).toBe(204);
    expect((await get(item.id, adminCookie)).status).toBe(404);
    expect((await remove(item.id, adminCookie)).status).toBe(404);
  });

  it("lists published and unpublished items, newest first, with search", async () => {
    await create({ title: `First ${testRunId}`, isPublished: true }, adminCookie);
    await create({ title: `Second ${testRunId}` }, adminCookie);

    const { status, body } = await list(`?search=${testRunId}`, adminCookie);
    expect(status).toBe(200);
    const page = body as PaginatedResponse<Item>;
    expect(page.data.map((item) => item.title)).toEqual([`Second ${testRunId}`, `First ${testRunId}`]);
    expect(page.meta).toEqual({ page: 1, pageSize: 12, total: 2, totalPages: 1 });
  });

  it("validates bodies, ids and queries", async () => {
    expect(await create({ title: "" }, adminCookie)).toEqual({ status: 400, body: { message: "Ingresa un título", status: 400 } });
    expect((await update(missingId, {}, adminCookie)).body).toEqual({ message: "Indica qué cambiar", status: 400 });
    expect((await update(missingId, { title: "Nuevo" }, adminCookie)).status).toBe(404);
    expect((await get("not-a-uuid", adminCookie)).status).toBe(400);
    expect((await list("?page=0", adminCookie)).status).toBe(400);
  });
});
