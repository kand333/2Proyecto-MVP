import Link from "next/link";
import { cn } from "@/lib/cn";
import { navigationItems } from "./navigation-items";

type NavigationLinksProps = {
  activeHref: string | null;
  orientation: "horizontal" | "vertical";
  onNavigate?: () => void;
};

/** Inicio, Catálogo and Contacto in brand type (docs/design.md): the active one in ink, the rest muted. */
export function NavigationLinks({ activeHref, orientation, onNavigate }: NavigationLinksProps) {
  return (
    <ul className={cn("flex", orientation === "horizontal" ? "items-center gap-1" : "flex-col gap-1")}>
      {navigationItems.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "block font-display font-semibold uppercase font-stretch-condensed transition-colors duration-200",
                orientation === "horizontal" ? "px-3 py-2 text-base" : "px-4 py-3 text-lg",
                isActive ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
