import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/http/api-error";
import { escapeLikePattern } from "@/lib/escape-like";
import { prisma } from "@/lib/prisma";
import { ORDER_NOT_FOUND, toOrderView } from "@/services/order-view-service";
import type { PaginatedResponse } from "@portal/shared/pagination";
import {
  ORDER_STATUS_LABELS,
  canTransition,
  type AdminOrder,
  type AdminOrderListQuery,
  type AdminOrderSummary,
  type OrderStatusChange,
} from "@portal/shared/order";

/** Search by order number (digits) or by email (contains, ignoring case). */
function orderSearchWhere(search: string | undefined): Prisma.OrderWhereInput {
  const text = search?.trim();
  if (!text) return {};
  const asNumber = /^\d{1,9}$/.test(text) ? Number(text) : null;
  return {
    OR: [{ email: { contains: escapeLikePattern(text), mode: "insensitive" } }, ...(asNumber === null ? [] : [{ number: asNumber }])],
  };
}

/** ADMIN list (RF-15): newest first, filter by status, search by number or email. */
export async function listOrders({ status, search, page, pageSize }: AdminOrderListQuery): Promise<PaginatedResponse<AdminOrderSummary>> {
  const where: Prisma.OrderWhereInput = { ...orderSearchWhere(search), ...(status ? { status } : {}) };
  const [records, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { number: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, number: true, status: true, createdAt: true, name: true, email: true, shippingMethod: true, totalClp: true },
    }),
    prisma.order.count({ where }),
  ]);
  return {
    data: records.map((record) => ({ ...record, createdAt: record.createdAt.toISOString() })),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getAdminOrder(id: string): Promise<AdminOrder> {
  const order = await prisma.order.findUnique({ where: { id }, include: { items: { orderBy: { id: "asc" } } } });
  if (!order) throw new ApiError(404, ORDER_NOT_FOUND);
  const settings = await prisma.shopSettings.findUniqueOrThrow({ where: { id: 1 }, select: { transferInstructions: true, pickupAddress: true } });
  return { ...toOrderView(order, settings), id: order.id, phone: order.phone, hasAccount: order.userId !== null };
}

/**
 * Applies a status change of RF-15 in one transaction. The update only matches the status read
 * before, so two admins changing the same order cannot both win. Cancelling puts the stock back and
 * frees the welcome code (DEC-004, RF-13).
 */
export async function changeOrderStatus(id: string, change: OrderStatusChange, now = new Date()): Promise<AdminOrder> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new ApiError(404, ORDER_NOT_FOUND);
    if (!canTransition(order.status, change.status)) {
      throw new ApiError(409, `No se puede pasar de «${ORDER_STATUS_LABELS[order.status]}» a «${ORDER_STATUS_LABELS[change.status]}»`);
    }

    const stamp: Prisma.OrderUpdateManyMutationInput =
      change.status === "PAID"
        ? { paidAt: now }
        : change.status === "SHIPPED"
          ? { shippedAt: now, trackingNumber: change.trackingNumber }
          : change.status === "DELIVERED"
            ? { deliveredAt: now }
            : { cancelledAt: now };
    const updated = await tx.order.updateMany({ where: { id, status: order.status }, data: { status: change.status, ...stamp } });
    if (updated.count === 0) throw new ApiError(409, "El pedido cambió mientras tanto. Recarga y vuelve a intentarlo.");

    if (change.status === "CANCELLED") {
      for (const item of order.items) {
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
      }
      await tx.subscriber.updateMany({ where: { redeemedOrderId: id }, data: { redeemedAt: null, redeemedOrderId: null } });
    }
  });
  return getAdminOrder(id);
}
