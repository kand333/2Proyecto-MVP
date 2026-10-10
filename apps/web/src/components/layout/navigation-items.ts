export type NavigationItem = {
  label: string;
  href: string;
};

/** Main navigation of the header (docs/design.md): the account and the cart are icons beside it. */
export const navigationItems: readonly NavigationItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Catálogo", href: "/products" },
  { label: "Contacto", href: "/contact" },
];

/**
 * Returns the href of the navigation item that matches the current URL (a section also covers its
 * sub-pages), or null when no item matches.
 */
export function getActiveNavigationHref(pathname: string): string | null {
  if (pathname === "/") return "/";
  const item = navigationItems.find(({ href }) => href !== "/" && (pathname === href || pathname.startsWith(`${href}/`)));
  return item?.href ?? null;
}
