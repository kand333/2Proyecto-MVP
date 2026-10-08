export type NavigationItem = {
  label: string;
  href: string;
};

export const navigationItems: readonly NavigationItem[] = [
  { label: "Inicio", href: "/" },
  // Public Item layer: remove this entry together with app/(site)/items.
  { label: "Items", href: "/items" },
  { label: "Ingresar", href: "/login" },
];

/**
 * Returns the href of the navigation item that matches the current URL (a section also covers its
 * sub-pages), or null when no item matches.
 */
export function getActiveNavigationHref(pathname: string): string | null {
  if (pathname === "/") return "/";
  // Reached from the user name shown in place of «Ingresar».
  if (pathname === "/account" || pathname.startsWith("/account/")) return "/account";

  const item = navigationItems.find(({ href }) => href !== "/" && (pathname === href || pathname.startsWith(`${href}/`)));
  return item?.href ?? null;
}
