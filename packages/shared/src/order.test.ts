import { describe, expect, it } from "vitest";
import { ALLOWED_TRANSITIONS, adminOrderListQuerySchema, canTransition, CHILE_REGIONS, orderCreateSchema, orderStatusChangeSchema, quoteSchema } from "./order";

const variantId = "0190a4f2-7c1e-7d3a-9b2f-4c5d6e7f8a9b";
const otherVariantId = "0190a4f2-7c1e-7d3a-9b2f-4c5d6e7f8a9c";
const quote = { lines: [{ variantId, quantity: 2 }], shippingMethod: "PICKUP" };
const order = { ...quote, email: "Ana@Example.com", name: "Ana Pérez", phone: "+56 9 1234 5678" };
const address = { region: "RM", commune: "Providencia", street: "Av. Providencia 1234" };

const issueOf = (result: { success: boolean; error?: { issues: { message: string; path: PropertyKey[] }[] } }) =>
  result.success ? null : result.error?.issues[0];

describe("quoteSchema", () => {
  it("accepts a cart and normalizes the discount code", () => {
    expect(quoteSchema.parse({ ...quote, discountCode: " bienvenida-k7mpq2 " }).discountCode).toBe("BIENVENIDA-K7MPQ2");
    expect(quoteSchema.parse({ ...quote, discountCode: "" }).discountCode).toBeUndefined();
  });

  it.each([
    [{ lines: [] }, "El carrito está vacío"],
    [{ lines: [{ variantId, quantity: 0 }] }, "La cantidad mínima es 1"],
    [{ lines: [{ variantId, quantity: 11 }] }, "La cantidad máxima es 10 por producto"],
    [{ lines: [{ variantId, quantity: 1.5 }] }, "La cantidad debe ser un número entero"],
    [{ lines: [{ variantId: "x", quantity: 1 }] }, "Producto inválido"],
    [{ shippingMethod: "DRONE" }, "Elige despacho o retiro"],
    [{ discountCode: "GRATIS" }, "El código de descuento no es válido"],
  ])("rejects %o", (override, message) => {
    expect(issueOf(quoteSchema.safeParse({ ...quote, ...override }))?.message).toBe(message);
  });

  it("rejects the same variant twice, on the repeated line", () => {
    const issue = issueOf(quoteSchema.safeParse({ ...quote, lines: [{ variantId, quantity: 1 }, { variantId, quantity: 2 }] }));
    expect(issue?.message).toBe("Producto repetido en el carrito");
    expect(issue?.path).toEqual(["lines", 1, "variantId"]);
    expect(quoteSchema.safeParse({ ...quote, lines: [{ variantId, quantity: 1 }, { variantId: otherVariantId, quantity: 1 }] }).success).toBe(true);
  });
});

describe("orderCreateSchema", () => {
  it("accepts a pickup order without address and normalizes the email", () => {
    const parsed = orderCreateSchema.parse(order);
    expect(parsed.email).toBe("ana@example.com");
    expect(parsed.address).toBeUndefined();
  });

  it("requires the address for delivery, on the address field", () => {
    const issue = issueOf(orderCreateSchema.safeParse({ ...order, shippingMethod: "DELIVERY" }));
    expect(issue).toMatchObject({ message: "Ingresa la dirección de despacho", path: ["address"] });
    expect(orderCreateSchema.safeParse({ ...order, shippingMethod: "DELIVERY", address }).success).toBe(true);
  });

  it("validates the address region, commune and street", () => {
    expect(issueOf(orderCreateSchema.safeParse({ ...order, shippingMethod: "DELIVERY", address: { ...address, region: "XX" } }))?.message).toBe(
      "Elige una región",
    );
    expect(issueOf(orderCreateSchema.safeParse({ ...order, shippingMethod: "DELIVERY", address: { ...address, street: " " } }))?.message).toBe(
      "Ingresa calle y número",
    );
  });

  it("rejects an invalid phone", () => {
    expect(issueOf(orderCreateSchema.safeParse({ ...order, phone: "abc12345" }))?.message).toBe("Usa solo números, espacios y un + inicial");
  });

  it("lists the 16 regions of Chile", () => {
    expect(Object.keys(CHILE_REGIONS)).toHaveLength(16);
  });
});

describe("order status changes", () => {
  it("allows only the transitions of RF-15", () => {
    expect(canTransition("PENDING_PAYMENT", "PAID")).toBe(true);
    expect(canTransition("PAID", "SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
    expect(canTransition("SHIPPED", "CANCELLED")).toBe(false);
    expect(canTransition("DELIVERED", "PAID")).toBe(false);
    expect(ALLOWED_TRANSITIONS.CANCELLED).toEqual([]);
  });

  it("requires the tracking number to ship, on its field", () => {
    const result = orderStatusChangeSchema.safeParse({ status: "SHIPPED", trackingNumber: "  " });
    expect(result.success ? null : result.error.issues[0]).toMatchObject({ message: "Ingresa el número de seguimiento", path: ["trackingNumber"] });
    expect(orderStatusChangeSchema.parse({ status: "SHIPPED", trackingNumber: " CX123 " })).toEqual({ status: "SHIPPED", trackingNumber: "CX123" });
    expect(orderStatusChangeSchema.parse({ status: "PAID" })).toEqual({ status: "PAID" });
  });

  it("reads the admin list filters", () => {
    expect(adminOrderListQuerySchema.parse({ status: "PAID", search: " 1042 ", page: "2" })).toMatchObject({ status: "PAID", search: "1042", page: 2 });
    expect(adminOrderListQuerySchema.parse({ status: "" }).status).toBeUndefined();
    expect(adminOrderListQuerySchema.safeParse({ status: "LOST" }).success).toBe(false);
  });
});
