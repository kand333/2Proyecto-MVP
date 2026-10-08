import { describe, expect, it } from "vitest";
import {
  adminProductListQuerySchema,
  formatClp,
  MAX_PRODUCT_VARIANTS,
  productCreateSchema,
  productListQuerySchema,
  productUpdateSchema,
} from "./product";

const variant = { name: "10 ml", sku: " ter-lim-10 ", priceClp: 12990, stock: 5 };
const valid = { name: "  Terpeno limón ", slug: "terpeno-limon", category: "TERPENES", variants: [variant] };

const issueOf = (result: { success: boolean; error?: { issues: { message: string; path: PropertyKey[] }[] } }) =>
  result.success ? null : result.error?.issues[0];

describe("productCreateSchema", () => {
  it("trims the text, normalizes the SKU and applies the defaults", () => {
    expect(productCreateSchema.parse(valid)).toEqual({
      name: "Terpeno limón",
      slug: "terpeno-limon",
      description: "",
      category: "TERPENES",
      isPublished: false,
      variants: [{ name: "10 ml", sku: "TER-LIM-10", priceClp: 12990, stock: 5, isActive: true }],
    });
  });

  it.each([
    [{ priceClp: 0 }, "El precio debe ser mayor que 0"],
    [{ priceClp: -10 }, "El precio debe ser mayor que 0"],
    [{ priceClp: 9990.5 }, "El precio debe ser un número entero de pesos"],
    [{ priceClp: "9990" }, "Ingresa el precio en pesos"],
    [{ stock: -1 }, "El stock no puede ser negativo"],
    [{ stock: 1.5 }, "El stock debe ser un número entero"],
    [{ sku: "   " }, "Ingresa el SKU"],
    [{ sku: "AB 1" }, "El SKU admite solo letras, números, guiones y guiones bajos"],
  ])("rejects a variant with %o", (override, message) => {
    expect(issueOf(productCreateSchema.safeParse({ ...valid, variants: [{ ...variant, ...override }] }))?.message).toBe(
      message,
    );
  });

  it("requires between 1 and 20 variants", () => {
    expect(issueOf(productCreateSchema.safeParse({ ...valid, variants: [] }))?.message).toBe("Agrega al menos una variante");
    const tooMany = Array.from({ length: MAX_PRODUCT_VARIANTS + 1 }, (_, index) => ({ ...variant, sku: `SKU-${index}` }));
    expect(issueOf(productCreateSchema.safeParse({ ...valid, variants: tooMany }))?.message).toBe(
      "Un producto admite hasta 20 variantes",
    );
    const maximum = tooMany.slice(0, MAX_PRODUCT_VARIANTS);
    expect(productCreateSchema.safeParse({ ...valid, variants: maximum }).success).toBe(true);
  });

  it("rejects a SKU repeated within the product, ignoring case and spaces, on the repeated variant", () => {
    const issue = issueOf(
      productCreateSchema.safeParse({ ...valid, variants: [variant, { ...variant, name: "30 ml", sku: "TER-LIM-10" }] }),
    );
    expect(issue?.message).toBe("El SKU TER-LIM-10 está repetido");
    expect(issue?.path).toEqual(["variants", 1, "sku"]);
  });

  it.each(["Terpeno Limón", "terpeno_limon", "-terpeno", "terpeno--limon"])("rejects the slug %s", (slug) => {
    expect(productCreateSchema.safeParse({ ...valid, slug }).success).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(issueOf(productCreateSchema.safeParse({ ...valid, category: "FOOD" }))?.message).toBe("Categoría inválida");
  });
});

describe("productUpdateSchema", () => {
  it("accepts any single field and rejects an empty change", () => {
    expect(productUpdateSchema.parse({ isPublished: true })).toEqual({ isPublished: true });
    expect(issueOf(productUpdateSchema.safeParse({}))?.message).toBe("Indica qué cambiar");
  });

  it("applies the variant rules to a new variant list", () => {
    expect(productUpdateSchema.safeParse({ variants: [] }).success).toBe(false);
    expect(productUpdateSchema.safeParse({ variants: [{ ...variant, stock: -2 }] }).success).toBe(false);
  });
});

describe("product list queries", () => {
  it("read page, search and category from query strings, ignoring empty values", () => {
    expect(productListQuerySchema.parse({ page: "2", search: " limón ", category: "VAPES" })).toEqual({
      page: 2,
      pageSize: 12,
      search: "limón",
      category: "VAPES",
    });
    expect(productListQuerySchema.parse({ category: "" })).toEqual({ page: 1, pageSize: 12, search: undefined, category: undefined });
    expect(productListQuerySchema.safeParse({ category: "FOOD" }).success).toBe(false);
  });

  it("add the status filter for the admin", () => {
    expect(adminProductListQuerySchema.parse({ status: "archived" }).status).toBe("archived");
    expect(adminProductListQuerySchema.safeParse({ status: "deleted" }).success).toBe(false);
  });
});

describe("formatClp", () => {
  it("formats whole pesos with a dot as thousands separator and no decimals", () => {
    expect(formatClp(12990)).toBe("$12.990");
    expect(formatClp(1500000)).toBe("$1.500.000");
    expect(formatClp(0)).toBe("$0");
  });
});
