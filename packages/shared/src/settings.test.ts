import { describe, expect, it } from "vitest";
import { shopSettingsSchema } from "./settings";

const valid = { flatShippingClp: 3990, freeShippingFromClp: 49990, pickupAddress: " Av. Providencia 1234 ", transferInstructions: "Banco X" };

describe("shopSettingsSchema", () => {
  it("trims the texts and accepts free delivery turned off", () => {
    expect(shopSettingsSchema.parse({ ...valid, freeShippingFromClp: null })).toEqual({
      ...valid,
      freeShippingFromClp: null,
      pickupAddress: "Av. Providencia 1234",
    });
  });

  it.each([
    [{ flatShippingClp: -1 }, "El costo de despacho no puede ser negativo"],
    [{ freeShippingFromClp: -5 }, "El monto para envío gratis no puede ser negativo"],
    [{ flatShippingClp: 10.5 }, "El costo de despacho debe ser un número entero de pesos"],
  ])("rejects %o", (override, message) => {
    const result = shopSettingsSchema.safeParse({ ...valid, ...override });
    expect(result.success ? null : result.error.issues[0]?.message).toBe(message);
  });
});
