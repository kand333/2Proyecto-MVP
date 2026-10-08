import { describe, expect, it } from "vitest";
import { adminNavigationItems, getActiveAdminSection } from "./admin-navigation";

describe("adminNavigationItems", () => {
  it("lists the sections in order", () => {
    expect(adminNavigationItems.map((item) => item.label)).toEqual([
      "Panel administración",
      "Administrar items",
      "Administrar usuarios",
      "Mi cuenta",
    ]);
  });
});

describe("getActiveAdminSection", () => {
  it.each([
    ["/admin", "dashboard"],
    ["/admin/users", "users"],
    ["/admin/items", "items"],
    ["/admin/items/new", "items"],
    ["/admin/items/11111111-1111-4111-8111-111111111111/edit", "items"],
    ["/admin/account", "account"],
  ])("%s → %s", (pathname, section) => {
    expect(getActiveAdminSection(pathname)).toBe(section);
  });

  it("does not confuse a prefix with a section", () => {
    expect(getActiveAdminSection("/admin/itemsx")).toBeNull();
    expect(getActiveAdminSection("/admin/unknown")).toBeNull();
  });
});
