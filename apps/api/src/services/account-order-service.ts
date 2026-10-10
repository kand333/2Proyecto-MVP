import "server-only";
import { prisma } from "@/lib/prisma";
import { loadOrderView } from "@/services/order-view-service";
import type { AccountOrderSummary, OrderView } from "@portal/shared/order";

/**
 * The customer's own orders, newest first (RF-16). Only orders placed with the account: guest orders
 * with the same email are never linked.
 */
export async function listAccountOrders(userId: string): Promise<AccountOrderSummary[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { number: "desc" }],
    select: { id: true, number: true, status: true, createdAt: true, totalClp: true, items: { select: { quantity: true } } },
  });
  return orders.map(({ items, createdAt, ...order }) => ({
    ...order,
    createdAt: createdAt.toISOString(),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  }));
}

/** One of the customer's orders; someone else's gets the same 404 as a missing one. */
export const getAccountOrder = (userId: string, id: string): Promise<OrderView> => loadOrderView({ id, userId });
