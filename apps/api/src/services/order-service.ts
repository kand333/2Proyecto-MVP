import "server-only";
import { randomBytes } from "node:crypto";
import { ApiError } from "@/lib/http/api-error";
import { prisma } from "@/lib/prisma";
import { buildQuote } from "@/services/checkout-service";
import { isAdult, type AuthUser } from "@portal/shared/auth";
import {
  ORDER_BIRTH_DATE_REQUIRED,
  ORDER_STOCK_CONFLICT,
  ORDER_UNDERAGE_MESSAGE,
  type OrderCreate,
  type OrderCreated,
} from "@portal/shared/order";

/** 32 random bytes in base64url (DEC-007): ≥ 128 bits, so a guest order cannot be guessed. */
export const newAccessToken = () => randomBytes(32).toString("base64url");

/** The account's birth date wins; a guest, or an account without one, must send it (RF-08, DEC-008). */
async function buyerBirthDate(user: AuthUser | null, sent: string | undefined): Promise<string> {
  if (user) {
    const record = await prisma.user.findUnique({ where: { id: user.id }, select: { birthDate: true } });
    if (record?.birthDate) return record.birthDate.toISOString().slice(0, 10);
  }
  if (!sent) throw new ApiError(400, ORDER_BIRTH_DATE_REQUIRED);
  return sent;
}

/**
 * Creates a PENDING_PAYMENT order (RF-08) in one transaction: the same quote as the checkout (prices
 * from the database), stock taken only where `stock >= quantity` (DEC-004: a concurrent order for the
 * last unit gets 409 and the whole order rolls back), and the welcome code redeemed only once (RF-13).
 */
export async function createOrder(input: OrderCreate, user: AuthUser | null, now = new Date()): Promise<OrderCreated> {
  const birthDate = await buyerBirthDate(user, input.birthDate);
  if (!isAdult(birthDate, now)) throw new ApiError(422, ORDER_UNDERAGE_MESSAGE);

  return prisma.$transaction(async (tx) => {
    const quote = await buildQuote(input, tx);
    if (!quote.canCheckout) throw new ApiError(409, ORDER_STOCK_CONFLICT);
    if (quote.discountError) throw new ApiError(400, quote.discountError);

    for (const line of quote.lines) {
      const taken = await tx.productVariant.updateMany({
        where: { id: line.variantId, isActive: true, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (taken.count === 0) throw new ApiError(409, ORDER_STOCK_CONFLICT);
    }

    const { address } = input;
    const order = await tx.order.create({
      data: {
        accessToken: newAccessToken(),
        userId: user?.id ?? null,
        email: input.email,
        name: input.name,
        phone: input.phone,
        birthDate: new Date(`${birthDate}T00:00:00Z`),
        shippingMethod: input.shippingMethod,
        ...(input.shippingMethod === "DELIVERY" && address
          ? { region: address.region, commune: address.commune, street: address.street, addressExtra: address.extra ?? null }
          : {}),
        subtotalClp: quote.subtotalClp,
        discountClp: quote.discountClp,
        shippingClp: quote.shippingClp,
        totalClp: quote.totalClp,
        discountCode: quote.discountCode,
        items: {
          create: quote.lines.map(({ variantId, productName, variantName, sku, unitPriceClp, quantity }) => ({
            variantId,
            productName,
            variantName,
            sku,
            unitPriceClp,
            quantity,
          })),
        },
      },
      select: { id: true, number: true, accessToken: true },
    });

    if (quote.discountCode) {
      // Only an unredeemed code: two orders racing for the same code cannot both use it.
      const redeemed = await tx.subscriber.updateMany({
        where: { code: quote.discountCode, redeemedAt: null },
        data: { redeemedAt: now, redeemedOrderId: order.id },
      });
      if (redeemed.count === 0) throw new ApiError(409, "El código de descuento ya fue usado");
    }

    return { number: order.number, accessToken: order.accessToken };
  });
}
