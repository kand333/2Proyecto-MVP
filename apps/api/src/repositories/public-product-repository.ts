import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** The public catalog shows published, non-archived products with at least one active variant (RF-02). */
const visible = { isPublished: true, isArchived: false, variants: { some: { isActive: true } } } satisfies Prisma.ProductWhereInput;

const activeVariants = {
  variants: { where: { isActive: true }, orderBy: [{ position: "asc" }, { id: "asc" }] },
  images: { orderBy: [{ position: "asc" }, { id: "asc" }] },
} satisfies Prisma.ProductInclude;

export async function findVisibleProducts(where: Prisma.ProductWhereInput, pagination: { skip: number; take: number }) {
  const filter = { AND: [where, visible] };
  const [records, total] = await prisma.$transaction([
    prisma.product.findMany({ where: filter, include: activeVariants, orderBy: [{ createdAt: "desc" }, { id: "desc" }], ...pagination }),
    prisma.product.count({ where: filter }),
  ]);
  return { records, total };
}

export function findVisibleProductBySlug(slug: string) {
  return prisma.product.findFirst({ where: { slug, ...visible }, include: activeVariants });
}
