import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { escapeLikePattern } from "@/lib/escape-like";
import { prisma } from "@/lib/prisma";

/** The title contains every term of the search (ignoring case). */
export function itemSearchWhere(searchTerms: string[]): Prisma.ItemWhereInput {
  return { AND: searchTerms.map((term) => ({ title: { contains: escapeLikePattern(term), mode: "insensitive" as const } })) };
}

/** Items matching `where` (published or not), newest first, and their total. */
export async function findItems(where: Prisma.ItemWhereInput, pagination: { skip: number; take: number }) {
  const [records, total] = await prisma.$transaction([
    prisma.item.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], ...pagination }),
    prisma.item.count({ where }),
  ]);
  return { records, total };
}

export function findItemById(id: string) {
  return prisma.item.findUnique({ where: { id } });
}

export function insertItem(data: Prisma.ItemCreateInput) {
  return prisma.item.create({ data });
}

/** Throws P2025 when the item does not exist. */
export function updateItem(id: string, data: Prisma.ItemUpdateInput) {
  return prisma.item.update({ where: { id }, data });
}

/** Throws P2025 when the item does not exist. */
export function deleteItem(id: string) {
  return prisma.item.delete({ where: { id }, select: { id: true } });
}
