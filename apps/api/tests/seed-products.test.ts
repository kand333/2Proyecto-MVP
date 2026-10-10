import { PRODUCT_CATEGORIES, productCreateSchema } from "@portal/shared/product";
import { describe, expect, it } from "vitest";
import { DEMO_PRODUCTS } from "../prisma/seed/products";

// The demo catalog of the seed (T008) must pass the same validation as the admin API.
describe("demo products", () => {
  it.each(DEMO_PRODUCTS)("$slug is a valid product", (product) => {
    expect(productCreateSchema.safeParse(product).success).toBe(true);
  });

  it("has 2 products per category, 4 featured and 2 offers on the cheapest variant", () => {
    for (const category of PRODUCT_CATEGORIES) {
      expect(DEMO_PRODUCTS.filter((product) => product.category === category)).toHaveLength(2);
    }
    expect(DEMO_PRODUCTS.filter((product) => product.isFeatured)).toHaveLength(4);
    const offers = DEMO_PRODUCTS.filter((product) => {
      const cheapest = product.variants.reduce((lowest, variant) => (variant.priceClp < lowest.priceClp ? variant : lowest));
      return cheapest.compareAtPriceClp !== null;
    });
    expect(offers).toHaveLength(2);
  });

  it("uses unique slugs and SKUs", () => {
    expect(new Set(DEMO_PRODUCTS.map((product) => product.slug)).size).toBe(DEMO_PRODUCTS.length);
    const skus = DEMO_PRODUCTS.flatMap((product) => product.variants.map((variant) => variant.sku));
    expect(new Set(skus).size).toBe(skus.length);
  });
});
