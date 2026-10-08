export type AdminSection = "dashboard" | "items" | "users" | "account";

export type AdminNavigationItem = { section: AdminSection; label: string; href: string };

/** Sidebar of /admin, in this order. */
export const adminNavigationItems: readonly AdminNavigationItem[] = [
  { section: "dashboard", label: "Panel administración", href: "/admin" },
  { section: "items", label: "Administrar items", href: "/admin/items" },
  { section: "users", label: "Administrar usuarios", href: "/admin/users" },
  { section: "account", label: "Mi cuenta", href: "/admin/account" },
];

/** Section of the current admin URL: a section also covers its sub-pages (e.g. an item's edit page). */
export function getActiveAdminSection(pathname: string): AdminSection | null {
  if (pathname === "/admin") return "dashboard";
  const item = adminNavigationItems.find(
    ({ section, href }) => section !== "dashboard" && (pathname === href || pathname.startsWith(`${href}/`)),
  );
  return item?.section ?? null;
}
