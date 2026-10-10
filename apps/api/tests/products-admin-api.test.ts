import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PaginatedResponse } from "@portal/shared/pagination";
import type { Product } from "@portal/shared/product";

// Integration test: ADMIN management of products and their variants (RF-01, RF-27), against the test database.
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
    data: { name: role, email: `${role.toLowerCase()}-products-${testRunId}@example.com`, passwordHash: "scrypt$not-used-here", role },
  });
  const { createSessionToken } = await import("@/lib/auth/session-token");
  return `terpenex_session=${createSessionToken(user.id)}`;
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
  const { GET } = await import("@/app/api/admin/products/route");
  return read(await GET(request(`/admin/products${query}`, "GET", cookie)));
}

async function create(body: unknown, cookie?: string) {
  const { POST } = await import("@/app/api/admin/products/route");
  return read(await POST(request("/admin/products", "POST", cookie, body)));
}

async function get(id: string, cookie?: string) {
  const { GET } = await import("@/app/api/admin/products/[id]/route");
  return read(await GET(request(`/admin/products/${id}`, "GET", cookie), context(id)));
}

async function update(id: string, body: unknown, cookie?: string) {
  const { PATCH } = await import("@/app/api/admin/products/[id]/route");
  return read(await PATCH(request(`/admin/products/${id}`, "PATCH", cookie, body), context(id)));
}

async function remove(id: string, cookie?: string) {
  const { DELETE } = await import("@/app/api/admin/products/[id]/route");
  return read(await DELETE(request(`/admin/products/${id}`, "DELETE", cookie), context(id)));
}

let sequence = 0;
/** A valid create body with a unique slug and SKUs for this run. */
function productBody(overrides: Record<string, unknown> = {}) {
  sequence += 1;
  const key = `${testRunId}-${sequence}`;
  return {
    name: `Terpeno ${key}`,
    slug: `terpeno-${key}`,
    category: "TERPENES",
    variants: [
      { name: "10 ml", sku: `T-${key}-10`, priceClp: 12990, stock: 5 },
      { name: "30 ml", sku: `T-${key}-30`, priceClp: 29990, compareAtPriceClp: 34990, stock: 0 },
    ],
    ...overrides,
  };
}

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("admin products API", () => {
  let adminCookie: string;
  let userCookie: string;

  beforeAll(async () => {
    adminCookie = await sessionCookieFor("ADMIN");
    userCookie = await sessionCookieFor("USER");
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.product.deleteMany({ where: { slug: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("answers 401 without a session and 403 to a USER", async () => {
    expect((await list("")).status).toBe(401);
    expect((await create(productBody(), userCookie)).status).toBe(403);
    expect((await update(missingId, { isPublished: true }, userCookie)).status).toBe(403);
    expect((await remove(missingId, userCookie)).status).toBe(403);
  });

  it("creates a featured product with its variants in order and reads it back", async () => {
    const body = productBody({ isFeatured: true });
    const created = await create(body, adminCookie);
    expect(created.status).toBe(201);
    const product = created.body as Product;
    expect(product).toMatchObject({ slug: body.slug, isPublished: false, isArchived: false, isFeatured: true });
    expect(product.variants.map(({ sku, position, compareAtPriceClp, isActive }) => ({ sku, position, compareAtPriceClp, isActive }))).toEqual([
      { sku: body.variants[0]?.sku.toUpperCase(), position: 0, compareAtPriceClp: null, isActive: true },
      { sku: body.variants[1]?.sku.toUpperCase(), position: 1, compareAtPriceClp: 34990, isActive: true },
    ]);

    expect(await get(product.id, adminCookie)).toEqual({ status: 200, body: product });
  });

  it("replaces the variants by SKU: updates, creates and deactivates the missing ones", async () => {
    const body = productBody();
    const product = (await create(body, adminCookie)).body as Product;
    const [first, second] = product.variants;

    const changed = await update(
      product.id,
      {
        isPublished: true,
        variants: [
          { name: "10 ml", sku: first?.sku, priceClp: 11990, compareAtPriceClp: 12990, stock: 8 },
          { name: "50 ml", sku: `T-${testRunId}-NEW`, priceClp: 44990, stock: 2 },
        ],
      },
      adminCookie,
    );
    expect(changed.status).toBe(200);
    const updated = changed.body as Product;
    expect(updated.isPublished).toBe(true);
    expect(updated.variants.map(({ sku, priceClp, compareAtPriceClp, stock, isActive, position }) => ({ sku, priceClp, compareAtPriceClp, stock, isActive, position }))).toEqual([
      { sku: first?.sku, priceClp: 11990, compareAtPriceClp: 12990, stock: 8, isActive: true, position: 0 },
      { sku: `T-${testRunId}-NEW`.toUpperCase(), priceClp: 44990, compareAtPriceClp: null, stock: 2, isActive: true, position: 1 },
      { sku: second?.sku, priceClp: 29990, compareAtPriceClp: 34990, stock: 0, isActive: false, position: 2 },
    ]);
  });

  it("answers 409 for a repeated slug or a SKU of another product", async () => {
    const existing = productBody();
    await create(existing, adminCookie);

    expect(await create(productBody({ slug: existing.slug }), adminCookie)).toEqual({
      status: 409,
      body: { message: "Ese slug ya lo usa otro producto", status: 409 },
    });
    const otherSku = existing.variants[0]?.sku.toUpperCase();
    expect(await create(productBody({ variants: [{ name: "x", sku: otherSku, priceClp: 990, stock: 1 }] }), adminCookie)).toEqual({
      status: 409,
      body: { message: `El SKU ${otherSku} ya lo usa otro producto`, status: 409 },
    });

    const other = (await create(productBody(), adminCookie)).body as Product;
    expect((await update(other.id, { slug: existing.slug }, adminCookie)).status).toBe(409);
    expect((await update(other.id, { variants: [{ name: "x", sku: otherSku, priceClp: 990, stock: 1 }] }, adminCookie)).status).toBe(409);
  });

  it("archives on DELETE and lists archived products only with status=archived", async () => {
    const product = (await create(productBody(), adminCookie)).body as Product;
    expect((await remove(product.id, adminCookie)).status).toBe(204);
    expect((await get(product.id, adminCookie)).body).toMatchObject({ id: product.id, isArchived: true });

    const active = (await list(`?search=${testRunId}&pageSize=50`, adminCookie)).body as PaginatedResponse<Product>;
    expect(active.data.some((item) => item.id === product.id)).toBe(false);
    const archived = (await list(`?search=${testRunId}&status=archived`, adminCookie)).body as PaginatedResponse<Product>;
    expect(archived.data.map((item) => item.id)).toEqual([product.id]);
  });

  it("filters by status, category and featured, newest first", async () => {
    const draft = (await create(productBody({ category: "ACCESSORIES" }), adminCookie)).body as Product;
    const published = (await create(productBody({ category: "ACCESSORIES", isPublished: true, isFeatured: true }), adminCookie)).body as Product;

    const accessories = (await list(`?search=${testRunId}&category=ACCESSORIES`, adminCookie)).body as PaginatedResponse<Product>;
    expect(accessories.data.map((item) => item.id)).toEqual([published.id, draft.id]);
    const drafts = (await list(`?search=${testRunId}&category=ACCESSORIES&status=draft`, adminCookie)).body as PaginatedResponse<Product>;
    expect(drafts.data.map((item) => item.id)).toEqual([draft.id]);
    const featured = (await list(`?search=${testRunId}&category=ACCESSORIES&featured=true`, adminCookie)).body as PaginatedResponse<Product>;
    expect(featured.data.map((item) => item.id)).toEqual([published.id]);
  });

  it("validates bodies, ids and queries", async () => {
    const offerBelowPrice = productBody({ variants: [{ name: "10 ml", sku: `T-${testRunId}-BAD`, priceClp: 12990, compareAtPriceClp: 9990, stock: 1 }] });
    expect(await create(offerBelowPrice, adminCookie)).toEqual({
      status: 400,
      body: { message: "El precio anterior debe ser mayor que el precio", status: 400 },
    });
    expect((await create(productBody({ variants: [] }), adminCookie)).status).toBe(400);
    expect((await update(missingId, {}, adminCookie)).body).toEqual({ message: "Indica qué cambiar", status: 400 });
    expect((await update(missingId, { name: "Nuevo" }, adminCookie)).status).toBe(404);
    expect((await remove(missingId, adminCookie)).status).toBe(404);
    expect((await get(missingId, adminCookie)).status).toBe(404);
    expect((await get("not-a-uuid", adminCookie)).status).toBe(400);
    expect((await list("?status=deleted", adminCookie)).status).toBe(400);
  });
});
