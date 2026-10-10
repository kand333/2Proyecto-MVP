import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Quote } from "@portal/shared/order";

// Integration test: server-side quote (RF-07, RF-13), against the test database. Restores the settings row.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

const testRunId = randomUUID().slice(0, 8);
const origin = "http://localhost:3000/api";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function quote(body: unknown) {
  const { POST } = await import("@/app/api/checkout/quote/route");
  const response = await POST(
    new Request(`${origin}/checkout/quote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  );
  return { status: response.status, body: (await response.json()) as Quote & { message?: string } };
}

const emailOf = (label: string) => `${label}-${testRunId}@example.com`;

describe.skipIf(!hasDatabaseUrl)("checkout quote API", () => {
  const ids: Record<string, string> = {};
  let originalSettings: { flatShippingClp: number; freeShippingFromClp: number | null };
  let welcomeCode: string;
  let usedCode: string;

  beforeAll(async () => {
    const prisma = await getPrisma();
    const settings = await prisma.shopSettings.findUniqueOrThrow({ where: { id: 1 } });
    originalSettings = { flatShippingClp: settings.flatShippingClp, freeShippingFromClp: settings.freeShippingFromClp };
    await prisma.shopSettings.update({ where: { id: 1 }, data: { flatShippingClp: 3990, freeShippingFromClp: 50000 } });

    const product = await prisma.product.create({
      data: {
        slug: `quote-${testRunId}`,
        name: `Quote ${testRunId}`,
        description: "",
        category: "TERPENES",
        isPublished: true,
        variants: {
          create: [
            { name: "1 ml", sku: `Q-${testRunId}-1`.toUpperCase(), priceClp: 10000, stock: 5, position: 0 },
            { name: "5 ml", sku: `Q-${testRunId}-5`.toUpperCase(), priceClp: 25000, stock: 1, position: 1 },
            { name: "Vieja", sku: `Q-${testRunId}-OLD`.toUpperCase(), priceClp: 990, stock: 9, isActive: false, position: 2 },
          ],
        },
      },
      include: { variants: true },
    });
    for (const variant of product.variants) ids[variant.name] = variant.id;
    const draft = await prisma.product.create({
      data: {
        slug: `quote-draft-${testRunId}`,
        name: "Draft",
        description: "",
        category: "TERPENES",
        variants: { create: { name: "x", sku: `Q-${testRunId}-DRAFT`.toUpperCase(), priceClp: 990, stock: 9, position: 0 } },
      },
      include: { variants: true },
    });
    ids.draft = draft.variants[0]?.id as string;

    const { generateWelcomeCode } = await import("@/services/subscriber-service");
    welcomeCode = generateWelcomeCode();
    usedCode = generateWelcomeCode();
    await prisma.subscriber.create({ data: { email: emailOf("nuevo"), code: welcomeCode, marketingConsent: true } });
    await prisma.subscriber.create({ data: { email: emailOf("cliente"), code: usedCode, marketingConsent: true } });
    // A previous, not cancelled order of this email: the welcome code is only for the first one.
    await prisma.order.create({
      data: {
        accessToken: `quote-${testRunId}`,
        email: emailOf("cliente"),
        name: "Cliente",
        phone: "+56 9 1234 5678",
        birthDate: new Date("1990-01-01"),
        shippingMethod: "PICKUP",
        subtotalClp: 1000,
        shippingClp: 0,
        totalClp: 1000,
      },
    });
  });

  beforeEach(async () => {
    const { resetRateLimits } = await import("@/lib/http/rate-limit");
    resetRateLimits();
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.shopSettings.update({ where: { id: 1 }, data: originalSettings });
    await prisma.order.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.subscriber.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.product.deleteMany({ where: { slug: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("uses database prices and charges the flat delivery below the free threshold", async () => {
    const { status, body } = await quote({ lines: [{ variantId: ids["1 ml"], quantity: 2 }], shippingMethod: "DELIVERY" });
    expect(status).toBe(200);
    expect(body).toMatchObject({ subtotalClp: 20000, discountClp: 0, shippingClp: 3990, totalClp: 23990, canCheckout: true, discountError: null });
    expect(body.lines[0]).toMatchObject({ unitPriceClp: 10000, quantity: 2, lineTotalClp: 20000, issue: null, productName: `Quote ${testRunId}` });
  });

  it("makes delivery free from the threshold and pickup always free", async () => {
    const free = await quote({ lines: [{ variantId: ids["1 ml"], quantity: 5 }], shippingMethod: "DELIVERY" });
    expect(free.body).toMatchObject({ subtotalClp: 50000, shippingClp: 0, totalClp: 50000 });
    const pickup = await quote({ lines: [{ variantId: ids["1 ml"], quantity: 1 }], shippingMethod: "PICKUP" });
    expect(pickup.body).toMatchObject({ shippingClp: 0, totalClp: 10000 });
  });

  it("marks lines without enough stock or no longer for sale, and blocks the checkout", async () => {
    const { body } = await quote({
      lines: [
        { variantId: ids["5 ml"], quantity: 2 },
        { variantId: ids.Vieja, quantity: 1 },
        { variantId: ids.draft, quantity: 1 },
        { variantId: "0190a4f2-7c1e-7d3a-9b2f-000000000000", quantity: 1 },
      ],
      shippingMethod: "PICKUP",
    });
    expect(body.lines.map((line) => line.issue)).toEqual(["INSUFFICIENT_STOCK", "UNAVAILABLE", "UNAVAILABLE", "UNAVAILABLE"]);
    expect(body.subtotalClp).toBe(50000);
    expect(body.canCheckout).toBe(false);
  });

  it("applies 10 % off the subtotal, rounded down, only for the subscribed email without previous orders", async () => {
    const lines = [{ variantId: ids["1 ml"], quantity: 1 }, { variantId: ids["5 ml"], quantity: 1 }];
    const applied = await quote({ lines, shippingMethod: "DELIVERY", email: emailOf("nuevo"), discountCode: welcomeCode.toLowerCase() });
    expect(applied.body).toMatchObject({ subtotalClp: 35000, discountClp: 3500, shippingClp: 3990, totalClp: 35490, discountCode: welcomeCode, discountError: null });

    const odd = await quote({ lines: [{ variantId: ids["1 ml"], quantity: 1 }], shippingMethod: "PICKUP", email: emailOf("nuevo"), discountCode: welcomeCode });
    expect(odd.body.discountClp).toBe(1000);

    const otherEmail = await quote({ lines, shippingMethod: "PICKUP", email: emailOf("otro"), discountCode: welcomeCode });
    expect(otherEmail.body).toMatchObject({ discountClp: 0, discountCode: null, discountError: "El código no corresponde a este email" });
    const noEmail = await quote({ lines, shippingMethod: "PICKUP", discountCode: welcomeCode });
    expect(noEmail.body.discountError).toBe("Ingresa tu email para usar el código");
    const repeatCustomer = await quote({ lines, shippingMethod: "PICKUP", email: emailOf("cliente"), discountCode: usedCode });
    expect(repeatCustomer.body).toMatchObject({ discountClp: 0, discountError: "El código solo vale para el primer pedido y ya fue usado" });
  });

  it("answers 400 for an empty cart or quantities out of 1-10", async () => {
    expect((await quote({ lines: [], shippingMethod: "PICKUP" })).status).toBe(400);
    expect((await quote({ lines: [{ variantId: ids["1 ml"], quantity: 11 }], shippingMethod: "PICKUP" })).status).toBe(400);
  });
});
