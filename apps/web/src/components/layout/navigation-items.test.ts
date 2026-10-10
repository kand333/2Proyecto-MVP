import { describe, expect, it } from "vitest";
import { getActiveNavigationHref, navigationItems } from "./navigation-items";

describe("navigationItems", () => {
  it("exposes the main navigation in order (the account and the cart are icons)", () => {
    expect(navigationItems.map((item) => item.label)).toEqual(["Inicio", "Catálogo", "Contacto"]);
  });
});

describe("getActiveNavigationHref", () => {
  it("marks home on the root path", () => {
    expect(getActiveNavigationHref("/")).toBe("/");
  });

  it("marks a section on its page and its sub-pages", () => {
    expect(getActiveNavigationHref("/products")).toBe("/products");
    expect(getActiveNavigationHref("/products/terpeno-limon")).toBe("/products");
    expect(getActiveNavigationHref("/contact")).toBe("/contact");
  });

  it("marks nothing elsewhere, and does not confuse a prefix with a section", () => {
    expect(getActiveNavigationHref("/login")).toBeNull();
    expect(getActiveNavigationHref("/productsx")).toBeNull();
  });
});
