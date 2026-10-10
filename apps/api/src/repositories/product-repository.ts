import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { escapeLikePattern } from "@/lib/escape-like";
import { prisma } from "@/lib/prisma";
import type { ProductVariantData } from "@portal/shared/product";

const withVariants = {
  variants: { orderBy: [{ position: "asc" }, { id: "asc" }] },
  images: { orderBy: [{ position: "asc" }, { id: "asc" }] },
} satisfies Prisma.ProductInclude;

/** The name contains every term of the search (ignoring case). */
export function productSearchWhere(searchTerms: string[]): Prisma.ProductWhereInput {
  return { AND: searchTerms.map((term) => ({ name: { contains: escapeLikePattern(term), mode: "insensitive" as const } })) };
}

/** Products matching `where`, newest first, with their variants, and their total. */
export async function findProducts(where: Prisma.ProductWhereInput, pagination: { skip: number; take: number }) {
  const [records, total] = await prisma.$transaction([
    prisma.product.findMany({ where, include: withVariants, orderBy: [{ createdAt: "desc" }, { id: "desc" }], ...pagination }),
    prisma.product.count({ where }),
  ]);
  return { records, total };
}

export function findProductById(id: string) {
  return prisma.product.findUnique({ where: { id }, include: withVariants });
}

/** Whether another product (not `exceptId`) already uses the slug. */
export async function isSlugTaken(slug: string, exceptId?: string) {
  return (await prisma.product.count({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) } })) > 0;
}

/** The first of the SKUs already used by a product other than `exceptProductId`, if any. */
export async function findTakenSku(skus: string[], exceptProductId?: string) {
  const taken = await prisma.productVariant.findFirst({
    where: { sku: { in: skus }, ...(exceptProductId ? { productId: { not: exceptProductId } } : {}) },
    select: { sku: true },
  });
  return taken?.sku ?? null;
}

type ProductFields = Omit<Prisma.ProductCreateInput, "variants">;

export function insertProduct(data: ProductFields, variants: ProductVariantData[]) {
  return prisma.product.create({
    data: { ...data, variants: { create: variants.map((variant, position) => ({ ...variant, position })) } },
    include: withVariants,
  });
}

/**
 * Updates the fields and, when `variants` is given, replaces the list by SKU: existing SKUs are
 * updated, new ones created, and missing ones deactivated (never deleted: orders point at them).
 * Throws P2025 when the product does not exist.
 */
export function updateProduct(id: string, data: Partial<ProductFields>, variants?: ProductVariantData[]) {
  return prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data });
    if (variants) {
      const skus = variants.map((variant) => variant.sku);
      await tx.productVariant.updateMany({
        where: { productId: id, sku: { notIn: skus } },
        data: { isActive: false, position: variants.length },
      });
      // ponytail: the service checks SKUs of other products before this; a concurrent create of the same SKU
      // could still be upserted here (admin-only, rare). Move the check inside this transaction if it matters.
      for (const [position, variant] of variants.entries()) {
        await tx.productVariant.upsert({
          where: { sku: variant.sku },
          create: { ...variant, position, productId: id },
          update: { ...variant, position },
        });
      }
    }
    return tx.product.findUniqueOrThrow({ where: { id }, include: withVariants });
  });
}
