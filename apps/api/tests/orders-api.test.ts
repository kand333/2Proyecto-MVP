import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// Integration test: order creation (RF-08, RF-13, DEC-004, DEC-007) against the test database. Restores the settings row.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const origin = "http://localhost:3100/api";
const emailOf = (label: string) => `${label}-${testRunId}@example.com`;

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function placeOrder(body: unknown, cookie?: string) {
  const { POST } = await import("@/app/api/orders/route");
  const response = await POST(
    new NextRequest(`${origin}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
    }),
  );
  return { status: response.status, body: await response.json() };
}

const guest = { name: "Ana Pérez", phone: "+56 9 1234 5678" };
const buyer = { ...guest, birthDate: "1990-05-01" };
const address = { region: "RM", commune: "Providencia", street: "Av. Providencia 1234" };

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("orders API", () => {
  const variants: Record<string, string> = {};
  let originalSettings: { flatShippingClp: number; freeShippingFromClp: number | null };

  async function variantWithStock(key: string, stock: number, priceClp = 10000) {
    const prisma = await getPrisma();
    const product = await prisma.product.create({
      data: {
        slug: `pedido-${key}-${testRunId}`,
        name: `Pedido ${key} ${testRunId}`,
        description: "",
        category: "TERPENES",
        isPublished: true,
        variants: { create: { name: "1 ml", sku: `O-${key}-${testRunId}`.toUpperCase(), priceClp, stock, position: 0 } },
      },
      include: { variants: true },
    });
    return product.variants[0]?.id as string;
  }

  const stockOf = async (variantId: string) => (await (await getPrisma()).productVariant.findUniqueOrThrow({ where: { id: variantId } })).stock;

  beforeAll(async () => {
    const prisma = await getPrisma();
    const settings = await prisma.shopSettings.findUniqueOrThrow({ where: { id: 1 } });
    originalSettings = { flatShippingClp: settings.flatShippingClp, freeShippingFromClp: settings.freeShippingFromClp };
    await prisma.shopSettings.update({ where: { id: 1 }, data: { flatShippingClp: 3990, freeShippingFromClp: null } });
    variants.main = await variantWithStock("main", 10);
    variants.other = await variantWithStock("other", 5, 2500);
    variants.last = await variantWithStock("last", 1);
  });

  beforeEach(async () => {
    const { resetRateLimits } = await import("@/lib/http/rate-limit");
    resetRateLimits();
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.shopSettings.update({ where: { id: 1 }, data: originalSettings });
    await prisma.subscriber.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.order.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.product.deleteMany({ where: { slug: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("creates a PENDING_PAYMENT order with server prices, takes the stock and returns a secret token", async () => {
    const before = await stockOf(variants.main as string);
    const { status, body } = await placeOrder({
      ...buyer,
      email: emailOf("invitado"),
      shippingMethod: "DELIVERY",
      address,
      lines: [
        { variantId: variants.main, quantity: 2 },
        { variantId: variants.other, quantity: 1 },
      ],
    });
    expect(status).toBe(201);
    expect(body.accessToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(typeof body.number).toBe("number");
    expect(await stockOf(variants.main as string)).toBe(before - 2);

    const prisma = await getPrisma();
    const order = await prisma.order.findUniqueOrThrow({ where: { accessToken: body.accessToken }, include: { items: true } });
    expect(order).toMatchObject({ status: "PENDING_PAYMENT", subtotalClp: 22500, shippingClp: 3990, totalClp: 26490, region: "RM", userId: null });
    expect(order.items.map((item) => [item.unitPriceClp, item.quantity, item.sku])).toEqual(
      expect.arrayContaining([
        [10000, 2, `O-MAIN-${testRunId}`.toUpperCase()],
        [2500, 1, `O-OTHER-${testRunId}`.toUpperCase()],
      ]),
    );
  });

  it("answers 409 and changes nothing when one line does not have enough stock", async () => {
    const mainBefore = await stockOf(variants.main as string);
    const { status } = await placeOrder({
      ...buyer,
      email: emailOf("sin-stock"),
      shippingMethod: "PICKUP",
      lines: [
        { variantId: variants.main, quantity: 1 },
        { variantId: variants.other, quantity: 10 },
      ],
    });
    expect(status).toBe(409);
    expect(await stockOf(variants.main as string)).toBe(mainBefore);
    const prisma = await getPrisma();
    expect(await prisma.order.count({ where: { email: emailOf("sin-stock") } })).toBe(0);
  });

  it("lets only one of two concurrent orders take the last unit", async () => {
    const order = (label: string) =>
      placeOrder({ ...buyer, email: emailOf(label), shippingMethod: "PICKUP", lines: [{ variantId: variants.last, quantity: 1 }] });
    const results = await Promise.all([order("carrera-a"), order("carrera-b")]);
    expect(results.map((result) => result.status).sort()).toEqual([201, 409]);
    expect(await stockOf(variants.last as string)).toBe(0);
  });

  it("answers 422 for a minor and 400 without a birth date for a guest", async () => {
    const lines = [{ variantId: variants.main, quantity: 1 }];
    const today = new Date();
    const seventeen = `${today.getFullYear() - 17}-01-01`;
    expect(await placeOrder({ ...buyer, birthDate: seventeen, email: emailOf("menor"), shippingMethod: "PICKUP", lines })).toEqual({
      status: 422,
      body: { message: "Debes tener al menos 18 años para comprar", status: 422 },
    });
    expect((await placeOrder({ ...guest, email: emailOf("sin-fecha"), shippingMethod: "PICKUP", lines })).status).toBe(400);
  });

  it("uses the birth date of the account and links the order to it", async () => {
    const prisma = await getPrisma();
    const user = await prisma.user.create({
      data: { name: "Cliente", email: emailOf("cuenta"), passwordHash: "scrypt$not-used-here", birthDate: new Date("1985-03-10T00:00:00Z") },
    });
    const { createSessionToken } = await import("@/lib/auth/session-token");
    const { status, body } = await placeOrder(
      { ...guest, email: emailOf("cuenta"), shippingMethod: "PICKUP", lines: [{ variantId: variants.main, quantity: 1 }] },
      `terpenex_session=${createSessionToken(user.id)}`,
    );
    expect(status).toBe(201);
    expect((await prisma.order.findUniqueOrThrow({ where: { accessToken: body.accessToken } })).userId).toBe(user.id);
  });

  it("applies the welcome code once and marks it redeemed", async () => {
    const { generateWelcomeCode } = await import("@/services/subscriber-service");
    const code = generateWelcomeCode();
    const prisma = await getPrisma();
    await prisma.subscriber.create({ data: { email: emailOf("bienvenida"), code, marketingConsent: true } });
    const order = () =>
      placeOrder({ ...buyer, email: emailOf("bienvenida"), shippingMethod: "PICKUP", discountCode: code, lines: [{ variantId: variants.main, quantity: 1 }] });

    const first = await order();
    expect(first.status).toBe(201);
    const saved = await prisma.order.findUniqueOrThrow({ where: { accessToken: first.body.accessToken } });
    expect(saved).toMatchObject({ subtotalClp: 10000, discountClp: 1000, totalClp: 9000, discountCode: code });
    expect(await prisma.subscriber.findUniqueOrThrow({ where: { code } })).toMatchObject({ redeemedOrderId: saved.id, redeemedAt: expect.any(Date) });

    const second = await order();
    expect(second.status).toBe(400);
  });

  it("answers 400 for an empty cart or a delivery without address", async () => {
    expect((await placeOrder({ ...buyer, email: emailOf("vacio"), shippingMethod: "PICKUP", lines: [] })).status).toBe(400);
    expect(
      (await placeOrder({ ...buyer, email: emailOf("sin-direccion"), shippingMethod: "DELIVERY", lines: [{ variantId: variants.main, quantity: 1 }] })).status,
    ).toBe(400);
  });
});

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("order by token", () => {
  async function getOrder(token: string) {
    const { GET } = await import("@/app/api/orders/[token]/route");
    const response = await GET(new NextRequest(`${origin}/orders/${token}`), { params: Promise.resolve({ token }) });
    return { status: response.status, body: await response.json() };
  }

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.order.deleteMany({ where: { email: { contains: `token-${testRunId}` } } });
  });

  it("shows the order to whoever has its token, with the transfer instructions while it waits for payment", async () => {
    const prisma = await getPrisma();
    const { newAccessToken } = await import("@/services/order-service");
    const accessToken = newAccessToken();
    const order = await prisma.order.create({
      data: {
        accessToken,
        email: `token-${testRunId}@example.com`,
        name: "Ana",
        phone: "+56 9 1234 5678",
        birthDate: new Date("1990-01-01"),
        shippingMethod: "PICKUP",
        subtotalClp: 0,
        shippingClp: 0,
        totalClp: 0,
      },
    });
    const { status, body } = await getOrder(accessToken);
    expect(status).toBe(200);
    expect(body).toMatchObject({ number: order.number, status: "PENDING_PAYMENT", shippingMethod: "PICKUP", address: null, items: [] });
    expect(body).not.toHaveProperty("id");
    expect(body).not.toHaveProperty("accessToken");
    expect("transferInstructions" in body && "pickupAddress" in body).toBe(true);
  });

  it("answers the same 404 for an unknown or malformed token", async () => {
    const { newAccessToken } = await import("@/services/order-service");
    expect(await getOrder(newAccessToken())).toEqual({ status: 404, body: { message: "Pedido no encontrado", status: 404 } });
    expect((await getOrder("corto")).status).toBe(404);
  });
});
