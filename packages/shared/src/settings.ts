import { z } from "zod";
import { MAX_PRICE_CLP } from "./product";

// Contract of the shop settings endpoints (RF-10). Amounts are whole CLP (DEC-003).

export const PICKUP_ADDRESS_MAX_LENGTH = 200;
export const TRANSFER_INSTRUCTIONS_MAX_LENGTH = 2000;

const amountSchema = (label: string) =>
  z
    .number({ error: `Ingresa ${label} en pesos` })
    .int({ error: `${label[0]?.toUpperCase()}${label.slice(1)} debe ser un número entero de pesos` })
    .min(0, { error: `${label[0]?.toUpperCase()}${label.slice(1)} no puede ser negativo` })
    .max(MAX_PRICE_CLP, { error: `${label[0]?.toUpperCase()}${label.slice(1)} es demasiado alto` });

/** Body of `PUT /api/admin/settings`: the whole settings row. */
export const shopSettingsSchema = z.object({
  flatShippingClp: amountSchema("el costo de despacho"),
  /** Subtotal from which delivery is free; null = never free. */
  freeShippingFromClp: amountSchema("el monto para envío gratis").nullable(),
  pickupAddress: z
    .string({ error: "Dirección de retiro inválida" })
    .trim()
    .max(PICKUP_ADDRESS_MAX_LENGTH, { error: `La dirección de retiro admite hasta ${PICKUP_ADDRESS_MAX_LENGTH} caracteres` }),
  transferInstructions: z
    .string({ error: "Instrucciones de transferencia inválidas" })
    .trim()
    .max(TRANSFER_INSTRUCTIONS_MAX_LENGTH, {
      error: `Las instrucciones de transferencia admiten hasta ${TRANSFER_INSTRUCTIONS_MAX_LENGTH} caracteres`,
    }),
});
export type ShopSettings = z.output<typeof shopSettingsSchema>;

/** `GET /api/settings`: what the cart and checkout show. The bank details only appear on an order (RF-09). */
export type PublicShopSettings = Pick<ShopSettings, "flatShippingClp" | "freeShippingFromClp" | "pickupAddress">;
