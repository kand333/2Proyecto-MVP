import { USER_ROLES } from "@portal/shared/enums";
import { ORDER_STATUSES, SHIPPING_METHODS } from "@portal/shared/order";
import { PRODUCT_CATEGORIES } from "@portal/shared/product";
import { describe, expect, it } from "vitest";
import { OrderStatus, ProductCategory, ShippingMethod, UserRole } from "@/generated/prisma/enums";

// The REST contract (@portal/shared) must stay aligned with the database enums.
describe("shared REST contract", () => {
  it("uses the same enum values as the Prisma schema", () => {
    expect([...USER_ROLES]).toEqual(Object.values(UserRole));
    expect([...PRODUCT_CATEGORIES]).toEqual(Object.values(ProductCategory));
    expect([...ORDER_STATUSES]).toEqual(Object.values(OrderStatus));
    expect([...SHIPPING_METHODS]).toEqual(Object.values(ShippingMethod));
  });
});
