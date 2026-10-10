import { productCreateSchema } from "@portal/shared/product";
import { describe, expect, it } from "vitest";
import { conflictErrorsOf, fieldErrorsOf } from "./product-form";

describe("fieldErrorsOf", () => {
  it("keys each error by its field path, keeping the first one", () => {
    const result = productCreateSchema.safeParse({
      name: "",
      slug: "Mal Slug",
      category: "TERPENES",
      variants: [{ name: "1 ml", sku: "A-1", priceClp: 1000, compareAtPriceClp: 900, stock: 1 }],
    });
    expect(result.success).toBe(false);
    const errors = fieldErrorsOf(result.success ? [] : result.error.issues);
    expect(errors.name).toBe("Ingresa un nombre");
    expect(errors.slug).toContain("minúsculas");
    expect(errors["variants.0.compareAtPriceClp"]).toBe("El precio anterior debe ser mayor que el precio");
  });
});

describe("conflictErrorsOf", () => {
  it("puts a repeated slug next to the slug field", () => {
    expect(conflictErrorsOf("Ese slug ya lo usa otro producto", [])).toEqual({ slug: "Ese slug ya lo usa otro producto" });
  });

  it("puts a repeated SKU next to the variant that has it", () => {
    expect(conflictErrorsOf("El SKU TER-LIM-5 ya lo usa otro producto", ["ter-lim-1", " ter-lim-5 "])).toEqual({
      "variants.1.sku": "El SKU TER-LIM-5 ya lo usa otro producto",
    });
  });

  it("falls back to the form when no field matches", () => {
    expect(conflictErrorsOf("El slug o un SKU ya lo usa otro producto", [])).toEqual({ slug: "El slug o un SKU ya lo usa otro producto" });
    expect(conflictErrorsOf("Conflicto", ["A"])).toEqual({ form: "Conflicto" });
  });
});
