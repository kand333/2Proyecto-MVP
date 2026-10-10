import { describe, expect, it } from "vitest";
import { adminNavigationItems, getActiveAdminSection } from "./admin-navigation";

describe("adminNavigationItems", () => {
  it("lists the sections in order", () => {
    expect(adminNavigationItems.map((item) => item.label)).toEqual([
      "Panel administración",
      "Pedidos",
      "Administrar productos",
      "Suscriptores",
      "Ajustes de tienda",
      "Administrar usuarios",
      "Mi cuenta",
    ]);
  });
});

describe("getActiveAdminSection", () => {
  it.each([
    ["/admin", "dashboard"],
    ["/admin/users", "users"],
    ["/admin/orders", "orders"],
    ["/admin/orders/11111111-1111-4111-8111-111111111111", "orders"],
    ["/admin/products", "products"],
    ["/admin/products/11111111-1111-4111-8111-111111111111/edit", "products"],
    ["/admin/subscribers", "subscribers"],
    ["/admin/settings", "settings"],
    ["/admin/account", "account"],
  ])("%s → %s", (pathname, section) => {
    expect(getActiveAdminSection(pathname)).toBe(section);
  });

  it("does not confuse a prefix with a section", () => {
    expect(getActiveAdminSection("/admin/ordersx")).toBeNull();
    expect(getActiveAdminSection("/admin/unknown")).toBeNull();
  });
});
