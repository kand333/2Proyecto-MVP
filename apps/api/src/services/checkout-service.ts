import "server-only";
import { prisma } from "@/lib/prisma";
import type { Quote, QuoteInput, QuoteLine } from "@portal/shared/order";
import { WELCOME_DISCOUNT_PERCENT } from "@portal/shared/subscriber";

export const DISCOUNT_NEEDS_EMAIL = "Ingresa tu email para usar el código";
export const DISCOUNT_OTHER_EMAIL = "El código no corresponde a este email";
export const DISCOUNT_ALREADY_USED = "El código solo vale para el primer pedido y ya fue usado";

/** Prisma client or the transaction of the order (T018), so quote and order never diverge. */
type Database = Pick<typeof prisma, "productVariant" | "subscriber" | "order" | "shopSettings">;

/** Error to show next to the code field, or null when the welcome code applies (RF-13). */
async function discountErrorOf(db: Database, code: string, email: string | undefined): Promise<string | null> {
  if (!email) return DISCOUNT_NEEDS_EMAIL;
  const subscriber = await db.subscriber.findUnique({ where: { code } });
  if (!subscriber || subscriber.email !== email) return DISCOUNT_OTHER_EMAIL;
  if (subscriber.redeemedAt) return DISCOUNT_ALREADY_USED;
  const previousOrders = await db.order.count({ where: { email, status: { not: "CANCELLED" } } });
  return previousOrders > 0 ? DISCOUNT_ALREADY_USED : null;
}

/**
 * The single price calculation used by the quote and by order creation (plan WS-03): database prices,
 * stock and active state per line, 10 % welcome discount on the subtotal (rounded down, DEC-003),
 * and shipping: pickup free, delivery flat unless the subtotal reaches the free threshold.
 */
export async function buildQuote({ lines, shippingMethod, email, discountCode }: QuoteInput, db: Database = prisma): Promise<Quote> {
  const variants = await db.productVariant.findMany({
    where: { id: { in: lines.map((line) => line.variantId) } },
    include: { product: { select: { name: true, isPublished: true, isArchived: true } } },
  });
  const byId = new Map(variants.map((variant) => [variant.id, variant]));

  const quoteLines = lines.map(({ variantId, quantity }): QuoteLine => {
    const variant = byId.get(variantId);
    if (!variant || !variant.isActive || !variant.product.isPublished || variant.product.isArchived) {
      return {
        variantId,
        productName: variant?.product.name ?? "Producto no disponible",
        variantName: variant?.name ?? "",
        sku: variant?.sku ?? "",
        unitPriceClp: 0,
        quantity,
        lineTotalClp: 0,
        issue: "UNAVAILABLE",
      };
    }
    return {
      variantId,
      productName: variant.product.name,
      variantName: variant.name,
      sku: variant.sku,
      unitPriceClp: variant.priceClp,
      quantity,
      lineTotalClp: variant.priceClp * quantity,
      issue: variant.stock < quantity ? "INSUFFICIENT_STOCK" : null,
    };
  });

  const subtotalClp = quoteLines.reduce((sum, line) => sum + line.lineTotalClp, 0);
  const discountError = discountCode ? await discountErrorOf(db, discountCode, email) : null;
  const discountClp = discountCode && !discountError ? Math.floor((subtotalClp * WELCOME_DISCOUNT_PERCENT) / 100) : 0;

  const settings = await db.shopSettings.findUniqueOrThrow({ where: { id: 1 } });
  const freeDelivery = settings.freeShippingFromClp !== null && subtotalClp >= settings.freeShippingFromClp;
  const shippingClp = shippingMethod === "PICKUP" || freeDelivery ? 0 : settings.flatShippingClp;

  return {
    lines: quoteLines,
    subtotalClp,
    discountClp,
    shippingClp,
    totalClp: subtotalClp - discountClp + shippingClp,
    discountCode: discountCode && !discountError ? discountCode : null,
    discountError,
    canCheckout: quoteLines.every((line) => line.issue === null),
  };
}
