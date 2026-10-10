import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PaginatedResponse } from "@portal/shared/pagination";
import type { PublicProduct, PublicProductSummary } from "@portal/shared/product";

// Integration test: public catalog (RF-02, RF-03, RF-27), against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

const testRunId = randomUUID().slice(0, 8);
const origin = "http://localhost:3000/api";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

const read = async (response: Response) => ({ status: response.status, body: await response.json() });

async function list(query: string) {
  const { GET } = await import("@/app/api/products/route");
  return read(await GET(new NextRequest(`${origin}/products${query}`)));
}

async function get(slug: string) {
  const { GET } = await import("@/app/api/products/[slug]/route");
  return read(await GET(new NextRequest(`${origin}/products/${slug}`), { params: Promise.resolve({ slug }) }));
}

type Seed = {
  key: string;
  isPublished?: boolean;
  isArchived?: boolean;
  isFeatured?: boolean;
  category?: "TERPENES" | "VAPES";
  variants: { priceClp: number; compareAtPriceClp?: number; stock: number; isActive?: boolean }[];
};

async function seed({ key, variants, ...product }: Seed) {
  const prisma = await getPrisma();
  const slug = `catalogo-${testRunId}-${key}`;
  await prisma.product.create({
    data: {
      slug,
      name: `Catálogo ${testRunId} ${key}`,
      description: "Texto",
      category: product.category ?? "TERPENES",
      isPublished: product.isPublished ?? true,
      isArchived: product.isArchived ?? false,
      isFeatured: product.isFeatured ?? false,
      variants: {
        create: variants.map((variant, position) => ({
          name: `V${position}`,
          sku: `C-${testRunId}-${key}-${position}`.toUpperCase(),
          position,
          ...variant,
        })),
      },
    },
  });
  return slug;
}

describe.skipIf(!hasDatabaseUrl)("public products API", () => {
  const slugs: Record<string, string> = {};

  beforeAll(async () => {
    // Created in this order, so the newest-first list is the reverse.
    slugs.offer = await seed({
      key: "offer",
      isFeatured: true,
      variants: [
        { priceClp: 15990, stock: 3 },
        { priceClp: 9990, compareAtPriceClp: 12990, stock: 0 },
        { priceClp: 4990, stock: 9, isActive: false },
      ],
    });
    slugs.plain = await seed({ key: "plain", category: "VAPES", variants: [{ priceClp: 19990, stock: 50 }] });
    slugs.draft = await seed({ key: "draft", isPublished: false, variants: [{ priceClp: 990, stock: 1 }] });
    slugs.archived = await seed({ key: "archived", isArchived: true, variants: [{ priceClp: 990, stock: 1 }] });
    slugs.inactive = await seed({ key: "inactive", variants: [{ priceClp: 990, stock: 1, isActive: false }] });
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.product.deleteMany({ where: { slug: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("lists only published, non-archived products with an active variant, newest first", async () => {
    const { status, body } = await list(`?search=${testRunId}`);
    expect(status).toBe(200);
    const page = body as PaginatedResponse<PublicProductSummary>;
    expect(page.data.map((product) => product.slug)).toEqual([slugs.plain, slugs.offer]);
    expect(page.meta).toEqual({ page: 1, pageSize: 12, total: 2, totalPages: 1 });
  });

  it("summarizes the cheapest active variant with its previous price, and stock across variants", async () => {
    const page = (await list(`?search=${testRunId}`)).body as PaginatedResponse<PublicProductSummary>;
    expect(page.data.find((product) => product.slug === slugs.offer)).toEqual({
      slug: slugs.offer,
      name: `Catálogo ${testRunId} offer`,
      category: "TERPENES",
      priceFromClp: 9990,
      compareAtFromClp: 12990,
      inStock: true,
      coverUrl: null,
    });
    expect(page.data.find((product) => product.slug === slugs.plain)).toMatchObject({ priceFromClp: 19990, compareAtFromClp: null });
  });

  it("filters by category and featured", async () => {
    const vapes = (await list(`?search=${testRunId}&category=VAPES`)).body as PaginatedResponse<PublicProductSummary>;
    expect(vapes.data.map((product) => product.slug)).toEqual([slugs.plain]);
    const featured = (await list(`?search=${testRunId}&featured=true`)).body as PaginatedResponse<PublicProductSummary>;
    expect(featured.data.map((product) => product.slug)).toEqual([slugs.offer]);
    expect((await list("?featured=maybe")).status).toBe(400);
  });

  it("shows a visible product with its active variants, without the exact stock", async () => {
    const { status, body } = await get(slugs.offer as string);
    expect(status).toBe(200);
    const product = body as PublicProduct;
    expect(product.variants.map(({ priceClp, compareAtPriceClp, inStock, lowStock }) => ({ priceClp, compareAtPriceClp, inStock, lowStock }))).toEqual([
      { priceClp: 15990, compareAtPriceClp: null, inStock: true, lowStock: true },
      { priceClp: 9990, compareAtPriceClp: 12990, inStock: false, lowStock: false },
    ]);
    expect(JSON.stringify(product)).not.toContain('"stock"');
  });

  it("answers 404 for a draft, archived, inactive-only or missing product", async () => {
    for (const slug of [slugs.draft, slugs.archived, slugs.inactive, `nada-${testRunId}`, "Not A Slug"]) {
      expect(await get(slug as string)).toEqual({ status: 404, body: { message: "Producto no encontrado", status: 404 } });
    }
  });
});
