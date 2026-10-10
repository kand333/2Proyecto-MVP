import "server-only";
import type { Order as OrderRecord, OrderItem as OrderItemRecord, ShopSettings } from "@/generated/prisma/client";
import { ApiError } from "@/lib/http/api-error";
import { prisma } from "@/lib/prisma";
import { orderTokenPattern, type ChileRegion, type OrderView } from "@portal/shared/order";

export const ORDER_NOT_FOUND = "Pedido no encontrado";

type OrderWithItems = OrderRecord & { items: OrderItemRecord[] };

/** The buyer's view of an order: never its id or the internal data; shop settings fill the payment and pickup info. */
export function toOrderView(order: OrderWithItems, settings: Pick<ShopSettings, "transferInstructions" | "pickupAddress">): OrderView {
  return {
    number: order.number,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    email: order.email,
    name: order.name,
    shippingMethod: order.shippingMethod,
    address:
      order.region && order.commune && order.street
        ? { region: order.region as ChileRegion, commune: order.commune, street: order.street, extra: order.addressExtra }
        : null,
    items: order.items.map(({ productName, variantName, sku, unitPriceClp, quantity }) => ({
      productName,
      variantName,
      sku,
      unitPriceClp,
      quantity,
      lineTotalClp: unitPriceClp * quantity,
    })),
    subtotalClp: order.subtotalClp,
    discountClp: order.discountClp,
    shippingClp: order.shippingClp,
    totalClp: order.totalClp,
    discountCode: order.discountCode,
    trackingNumber: order.trackingNumber,
    transferInstructions: order.status === "PENDING_PAYMENT" ? settings.transferInstructions || null : null,
    pickupAddress: order.shippingMethod === "PICKUP" ? settings.pickupAddress || null : null,
  };
}

export async function loadOrderView(where: { accessToken: string } | { id: string; userId: string }): Promise<OrderView> {
  const order = await prisma.order.findFirst({ where, include: { items: { orderBy: { id: "asc" } } } });
  if (!order) throw new ApiError(404, ORDER_NOT_FOUND);
  const settings = await prisma.shopSettings.findUniqueOrThrow({ where: { id: 1 }, select: { transferInstructions: true, pickupAddress: true } });
  return toOrderView(order, settings);
}

/** An order by its secret token (RF-09). A malformed or unknown token gets the same 404. */
export async function getOrderByToken(token: string): Promise<OrderView> {
  if (!orderTokenPattern.test(token)) throw new ApiError(404, ORDER_NOT_FOUND);
  return loadOrderView({ accessToken: token });
}
