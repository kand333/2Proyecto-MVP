import "server-only";
import { prisma } from "@/lib/prisma";

/** Counts for the ADMIN dashboard, computed in PostgreSQL in a single transaction. */
export async function countDashboardIndicators() {
  const [users, items, publishedItems] = await prisma.$transaction([
    prisma.user.count(),
    prisma.item.count(),
    prisma.item.count({ where: { isPublished: true } }),
  ]);
  return { users, items, publishedItems };
}
