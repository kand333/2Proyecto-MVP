import Link from "next/link";
import { cn } from "@/lib/cn";
import { navigationItems } from "./navigation-items";

type NavigationLinksProps = {
  activeHref: string | null;
  orientation: "horizontal" | "vertical";
  onNavigate?: () => void;
  /** Name of the logged-in user: replaces «Ingresar» with the name and a «Salir» button. */
  userName?: string;
  /** The logged-in user is an ADMIN: the name leads to the administration instead of /account. */
  isAdmin?: boolean;
  onLogout?: () => void;
};

const accountPillClassName = "rounded-full border border-line px-5 after:hidden hover:border-accent hover:bg-surface";

export function NavigationLinks({ activeHref, orientation, onNavigate, userName, isAdmin = false, onLogout }: NavigationLinksProps) {
  return (
    <ul
      className={cn(
        "flex",
        orientation === "horizontal" ? "items-center gap-1" : "flex-col gap-1",
      )}
    >
      {navigationItems.map((item) => {
        const isActive = item.href === activeHref;
        const isLogin = item.href === "/login";

        if (isLogin && userName) {
          return (
            <li
              key={item.href}
              className={cn(
                "flex items-center gap-2",
                orientation === "horizontal" ? "ml-3" : "justify-between px-4 py-2",
              )}
            >
              <Link
                href={isAdmin ? "/admin" : "/account"}
                onClick={onNavigate}
                aria-current={!isAdmin && activeHref === "/account" ? "page" : undefined}
                aria-label={isAdmin ? `Panel administración (${userName})` : `Mi cuenta (${userName})`}
                title={isAdmin ? "Panel administración" : "Mi cuenta"}
                className="max-w-40 truncate py-2 text-sm font-medium text-ink underline-offset-4 transition-colors duration-200 hover:underline hover:decoration-accent"
              >
                {userName}
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className={cn("py-2 text-sm font-medium text-muted transition-colors duration-200 hover:text-ink", accountPillClassName)}
              >
                Salir
              </button>
            </li>
          );
        }

        return (
          <li key={item.href} className={cn(isLogin && orientation === "horizontal" && "ml-3")}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative block px-3 py-2 text-sm font-medium transition-colors duration-200",
                // Active page: a fine accent rule under the label instead of a filled pill.
                "after:absolute after:inset-x-3 after:bottom-0.5 after:h-px after:origin-left after:bg-accent after:transition-transform after:duration-300 after:content-['']",
                isActive ? "text-ink after:scale-x-100" : "text-muted hover:text-ink after:scale-x-0 hover:after:scale-x-100",
                isLogin && accountPillClassName,
                orientation === "vertical" && "px-4 py-3 text-base after:inset-x-4",
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
