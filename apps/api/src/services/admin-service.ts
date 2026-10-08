import "server-only";
import { countDashboardIndicators } from "@/repositories/admin-repository";
import type { AdminDashboardStats } from "@portal/shared/admin";

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  const { users, items, publishedItems } = await countDashboardIndicators();
  return { users, items: { total: items, published: publishedItems } };
}
