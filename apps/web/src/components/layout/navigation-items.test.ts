import { describe, expect, it } from "vitest";
import { getActiveNavigationHref, navigationItems } from "./navigation-items";

describe("navigationItems", () => {
  it("exposes the public navigation in order", () => {
    expect(navigationItems.map((item) => item.label)).toEqual(["Inicio", "Catálogo", "Items", "Ingresar"]);
  });
});

describe("getActiveNavigationHref", () => {
  it("marks home on the root path", () => {
    expect(getActiveNavigationHref("/")).toBe("/");
  });

  it("marks a section on its page and its sub-pages", () => {
    expect(getActiveNavigationHref("/items")).toBe("/items");
    expect(getActiveNavigationHref("/items/abc")).toBe("/items");
  });

  it("marks login on the login page", () => {
    expect(getActiveNavigationHref("/login")).toBe("/login");
  });

  it("marks the account (the user name link) on the account pages", () => {
    expect(getActiveNavigationHref("/account")).toBe("/account");
    expect(getActiveNavigationHref("/account/edit")).toBe("/account");
  });

  it("returns null for routes outside the public navigation", () => {
    expect(getActiveNavigationHref("/admin")).toBeNull();
    expect(getActiveNavigationHref("/itemsx")).toBeNull();
  });
});
