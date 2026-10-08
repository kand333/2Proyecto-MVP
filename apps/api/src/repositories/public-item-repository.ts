import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { findItems } from "@/repositories/item-repository";
import { prisma } from "@/lib/prisma";

// Public Item layer: only published items. Removable as a whole (see CLAUDE.md).

const published = { isPublished: true } satisfies Prisma.ItemWhereInput;

export function findPublishedItems(where: Prisma.ItemWhereInput, pagination: { skip: number; take: number }) {
  return findItems({ AND: [where, published] }, pagination);
}

export function findPublishedItemById(id: string) {
  return prisma.item.findFirst({ where: { id, ...published } });
}
