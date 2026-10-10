import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { afterAll, describe, expect, it } from "vitest";

// Integration test: verifies defaults and constraints of the data model in PostgreSQL.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

const testRunId = randomUUID().slice(0, 8);
const uniqueName = (label: string) => `${label}-${testRunId}-${randomUUID().slice(0, 8)}`;

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function createUser(overrides: { email?: string } = {}) {
  const prisma = await getPrisma();
  return prisma.user.create({
    data: {
      email: overrides.email ?? `${uniqueName("user")}@example.com`,
      passwordHash: "not-a-real-hash",
      name: "Test User",
    },
  });
}

describe.skipIf(!hasDatabaseUrl)("data model", () => {
  afterAll(async () => {
    const prisma = await getPrisma();
    const namePattern = { contains: testRunId };
    await prisma.item.deleteMany({ where: { title: namePattern } });
    await prisma.order.deleteMany({ where: { email: namePattern } });
    await prisma.product.deleteMany({ where: { slug: namePattern } });
    await prisma.user.deleteMany({ where: { email: namePattern } });
    await prisma.$disconnect();
  });

  it("applies defaults to new users", async () => {
    const user = await createUser();
    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.role).toBe("USER");
    expect(user.isActive).toBe(true);
    expect(user.sessionsValidAfter).toBeNull();
  });

  it("rejects duplicated user emails", async () => {
    const email = `${uniqueName("duplicate")}@example.com`;
    await createUser({ email });
    await expect(createUser({ email })).rejects.toMatchObject({ code: "P2002" });
  });

  it("creates items unpublished by default", async () => {
    const prisma = await getPrisma();
    const item = await prisma.item.create({ data: { title: uniqueName("item"), description: "Test item" } });
    expect(item.isPublished).toBe(false);
    expect(item.createdAt).toBeInstanceOf(Date);
  });

  it("creates products not featured and variants without a previous price by default", async () => {
    const prisma = await getPrisma();
    const product = await prisma.product.create({
      data: {
        slug: uniqueName("product"),
        name: "Test product",
        description: "",
        category: "TERPENES",
        variants: { create: { name: "10 ml", sku: uniqueName("SKU").toUpperCase(), priceClp: 9990, stock: 1, position: 0 } },
      },
      include: { variants: true },
    });
    expect(product.isFeatured).toBe(false);
    expect(product.variants[0]?.compareAtPriceClp).toBeNull();
  });

  it("rejects a previous price that is not above the price (DEC-017)", async () => {
    const prisma = await getPrisma();
    const product = await prisma.product.create({
      data: { slug: uniqueName("offer"), name: "Offer product", description: "", category: "TERPENES" },
    });
    const variant = (compareAtPriceClp: number) =>
      prisma.productVariant.create({
        data: { productId: product.id, name: "10 ml", sku: uniqueName("SKU").toUpperCase(), priceClp: 9990, compareAtPriceClp, stock: 1, position: 0 },
      });
    await expect(variant(9990)).rejects.toThrow(/ProductVariant_compareAtPriceClp_check/);
    await expect(variant(12990)).resolves.toMatchObject({ compareAtPriceClp: 12990 });
  });

  it("numbers orders correlatively and rejects inconsistent totals or a delivery without address", async () => {
    const prisma = await getPrisma();
    const order = (overrides: Record<string, unknown> = {}) =>
      prisma.order.create({
        data: {
          accessToken: uniqueName("token"),
          email: `${uniqueName("order")}@example.com`,
          name: "Comprador",
          phone: "+56 9 1234 5678",
          birthDate: new Date("1990-05-01"),
          shippingMethod: "PICKUP",
          subtotalClp: 20000,
          discountClp: 2000,
          shippingClp: 0,
          totalClp: 18000,
          ...overrides,
        },
      });
    const first = await order();
    const second = await order();
    expect(first.status).toBe("PENDING_PAYMENT");
    expect(second.number).toBeGreaterThan(first.number);
    await expect(order({ totalClp: 20000 })).rejects.toThrow(/Order_amounts_check/);
    await expect(order({ shippingMethod: "DELIVERY", shippingClp: 3990, totalClp: 21990 })).rejects.toThrow(/Order_delivery_address_check/);
  });
});
