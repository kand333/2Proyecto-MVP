import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AdminOrder, AdminOrderSummary } from "@portal/shared/order";
import type { PaginatedResponse } from "@portal/shared/pagination";

// Integration test: admin orders and status changes (RF-15) against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const origin = "http://localhost:3100/api";
const missingId = "00000000-0000-4000-8000-000000000000";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function sessionCookieFor(role: "USER" | "ADMIN") {
  const prisma = await getPrisma();
  const user = await prisma.user.create({
    data: { name: role, email: `${role.toLowerCase()}-orders-admin-${testRunId}@example.com`, passwordHash: "scrypt$not-used-here", role },
  });
  const { createSessionToken } = await import("@/lib/auth/session-token");
  return `terpenex_session=${createSessionToken(user.id)}`;
}

const read = async (response: Response) => ({ status: response.status, body: await response.json() });

async function list(query: string, cookie?: string) {
  const { GET } = await import("@/app/api/admin/orders/route");
  return read(await GET(new NextRequest(`${origin}/admin/orders${query}`, { headers: cookie ? { cookie } : {} })));
}

async function get(id: string, cookie?: string) {
  const { GET } = await import("@/app/api/admin/orders/[id]/route");
  return read(await GET(new NextRequest(`${origin}/admin/orders/${id}`, { headers: cookie ? { cookie } : {} }), { params: Promise.resolve({ id }) }));
}

async function changeStatus(id: string, body: unknown, cookie?: string) {
  const { PATCH } = await import("@/app/api/admin/orders/[id]/status/route");
  return read(
    await PATCH(
      new NextRequest(`${origin}/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id }) },
    ),
  );
}

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("admin orders API", () => {
  let adminCookie: string;
  let userCookie: string;
  let variantId: string;

  /** A real order through the service: 2 units taken from the variant, optionally with a welcome code. */
  async function newOrder(label: string, discountCode?: string) {
    const { createOrder } = await import("@/services/order-service");
    const created = await createOrder(
      {
        lines: [{ variantId, quantity: 2 }],
        shippingMethod: "PICKUP",
        email: `${label}-${testRunId}@example.com`,
        name: `Cliente ${label}`,
        phone: "+56 9 1234 5678",
        birthDate: "1990-01-01",
        discountCode,
      },
      null,
    );
    const prisma = await getPrisma();
    return prisma.order.findUniqueOrThrow({ where: { accessToken: created.accessToken } });
  }

  const stock = async () => (await (await getPrisma()).productVariant.findUniqueOrThrow({ where: { id: variantId } })).stock;

  beforeAll(async () => {
    adminCookie = await sessionCookieFor("ADMIN");
    userCookie = await sessionCookieFor("USER");
    const prisma = await getPrisma();
    const product = await prisma.product.create({
      data: {
        slug: `admin-pedidos-${testRunId}`,
        name: `Admin pedidos ${testRunId}`,
        description: "",
        category: "TERPENES",
        isPublished: true,
        variants: { create: { name: "1 ml", sku: `AO-${testRunId}`.toUpperCase(), priceClp: 5000, stock: 50, position: 0 } },
      },
      include: { variants: true },
    });
    variantId = product.variants[0]?.id as string;
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.subscriber.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.order.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.product.deleteMany({ where: { slug: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("answers 401 without a session and 403 to a USER", async () => {
    expect((await list("")).status).toBe(401);
    expect((await list("", userCookie)).status).toBe(403);
    expect((await changeStatus(missingId, { status: "PAID" }, userCookie)).status).toBe(403);
  });

  it("lists orders newest first, filters by status and searches by number or email", async () => {
    const first = await newOrder("lista-a");
    const second = await newOrder("lista-b");
    const page = (await list(`?search=${testRunId}&pageSize=50`, adminCookie)).body as PaginatedResponse<AdminOrderSummary>;
    expect(page.data.map((order) => order.number).slice(0, 2)).toEqual([second.number, first.number]);
    const byNumber = (await list(`?search=${first.number}`, adminCookie)).body as PaginatedResponse<AdminOrderSummary>;
    expect(byNumber.data.map((order) => order.id)).toContain(first.id);
    const paid = (await list(`?search=${testRunId}&status=PAID`, adminCookie)).body as PaginatedResponse<AdminOrderSummary>;
    expect(paid.data).toEqual([]);
    expect((await list("?status=LOST", adminCookie)).status).toBe(400);
  });

  it("walks PENDING_PAYMENT → PAID → SHIPPED (with tracking) → DELIVERED, stamping each step", async () => {
    const order = await newOrder("camino");
    expect((await get(order.id, adminCookie)).body).toMatchObject({ id: order.id, status: "PENDING_PAYMENT", phone: "+56 9 1234 5678", hasAccount: false });

    expect((await changeStatus(order.id, { status: "PAID" }, adminCookie)).body).toMatchObject({ status: "PAID" });
    expect(await changeStatus(order.id, { status: "SHIPPED" }, adminCookie)).toEqual({
      status: 400,
      body: { message: "Ingresa el número de seguimiento", status: 400 },
    });
    const shipped = await changeStatus(order.id, { status: "SHIPPED", trackingNumber: "CX123" }, adminCookie);
    expect(shipped.body as AdminOrder).toMatchObject({ status: "SHIPPED", trackingNumber: "CX123" });
    expect((await changeStatus(order.id, { status: "DELIVERED" }, adminCookie)).body).toMatchObject({ status: "DELIVERED" });

    const prisma = await getPrisma();
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect([saved.paidAt, saved.shippedAt, saved.deliveredAt].every((date) => date instanceof Date)).toBe(true);
  });

  it("allows PAID → DELIVERED directly", async () => {
    const order = await newOrder("directo");
    await changeStatus(order.id, { status: "PAID" }, adminCookie);
    expect((await changeStatus(order.id, { status: "DELIVERED" }, adminCookie)).status).toBe(200);
  });

  it("answers 409 for invalid transitions", async () => {
    const order = await newOrder("invalida");
    expect((await changeStatus(order.id, { status: "DELIVERED" }, adminCookie)).status).toBe(409);
    expect((await changeStatus(order.id, { status: "SHIPPED", trackingNumber: "X1" }, adminCookie)).status).toBe(409);
    await changeStatus(order.id, { status: "PAID" }, adminCookie);
    await changeStatus(order.id, { status: "SHIPPED", trackingNumber: "X1" }, adminCookie);
    expect(await changeStatus(order.id, { status: "CANCELLED" }, adminCookie)).toMatchObject({ status: 409 });
  });

  it("puts the stock back and frees the welcome code when cancelling", async () => {
    const { generateWelcomeCode } = await import("@/services/subscriber-service");
    const code = generateWelcomeCode();
    const prisma = await getPrisma();
    await prisma.subscriber.create({ data: { email: `cancela-${testRunId}@example.com`, code, marketingConsent: true } });
    const before = await stock();
    const order = await newOrder("cancela", code);
    expect(await stock()).toBe(before - 2);
    expect((await prisma.subscriber.findUniqueOrThrow({ where: { code } })).redeemedAt).not.toBeNull();

    expect((await changeStatus(order.id, { status: "CANCELLED" }, adminCookie)).body).toMatchObject({ status: "CANCELLED" });
    expect(await stock()).toBe(before);
    expect(await prisma.subscriber.findUniqueOrThrow({ where: { code } })).toMatchObject({ redeemedAt: null, redeemedOrderId: null });
    expect((await changeStatus(order.id, { status: "PAID" }, adminCookie)).status).toBe(409);
  });

  it("answers 404 for a missing or malformed order", async () => {
    expect((await get(missingId, adminCookie)).status).toBe(404);
    expect((await get("x", adminCookie)).status).toBe(404);
    expect((await changeStatus(missingId, { status: "PAID" }, adminCookie)).status).toBe(404);
  });
});
