"use client";

import { List, User, X } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, type KeyboardEvent } from "react";
import { IconButton, iconButtonClassName } from "@/components/ui/icon-button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { logOut } from "@/lib/auth-client";
import { flash } from "@/lib/flash";
import { HeaderCartLink } from "./header-cart-link";
import { HeaderSearch } from "./header-search";
import { getActiveNavigationHref } from "./navigation-items";
import { NavigationLinks } from "./navigation-links";

const mobileNavigationId = "mobile-navigation";

const logoutClassName = "text-sm font-medium text-muted underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline";

/**
 * Header controls (docs/design.md): main navigation inline on desktop; search, account and cart as
 * icons; on mobile the navigation and the account live in the menu.
 */
export function SiteNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const activeHref = getActiveNavigationHref(pathname);
  const isAdmin = currentUser?.role === "ADMIN";
  const accountHref = currentUser ? (isAdmin ? "/admin" : "/account") : "/login";
  const accountLabel = currentUser ? (isAdmin ? `Panel administración (${currentUser.name})` : `Mi cuenta (${currentUser.name})`) : "Ingresar";

  function closeMenu() {
    setIsMenuOpen(false);
  }

  async function handleLogout() {
    closeMenu();
    await logOut().catch(() => flash("No pudimos cerrar la sesión. Inténtalo de nuevo.", "error"));
    router.refresh();
  }

  function handleMobileNavigationKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape") return;
    closeMenu();
    menuButtonRef.current?.focus();
  }

  return (
    <>
      <nav aria-label="Principal" className="hidden md:block">
        <NavigationLinks activeHref={activeHref} orientation="horizontal" />
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <HeaderSearch />
        <Link
          href={accountHref}
          aria-label={accountLabel}
          title={accountLabel}
          aria-current={activeHref === null && pathname.startsWith("/account") ? "page" : undefined}
          className={iconButtonClassName("hidden md:inline-flex")}
        >
          <User aria-hidden="true" />
        </Link>
        {currentUser && (
          <button type="button" onClick={handleLogout} className={`${logoutClassName} hidden px-2 md:inline`}>
            Salir
          </button>
        )}
        <HeaderCartLink />
        <IconButton
          ref={menuButtonRef}
          className="md:hidden"
          aria-expanded={isMenuOpen}
          aria-controls={mobileNavigationId}
          label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          icon={isMenuOpen ? <X /> : <List />}
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        />
      </div>

      {isMenuOpen && (
        <nav
          id={mobileNavigationId}
          aria-label="Principal"
          className="absolute inset-x-0 top-full border-b border-line bg-surface px-4 py-3 shadow-soft md:hidden"
          onKeyDown={handleMobileNavigationKeyDown}
        >
          <NavigationLinks activeHref={activeHref} orientation="vertical" onNavigate={closeMenu} />
          <div className="mt-2 flex items-center justify-between border-t border-line px-4 pt-3">
            <Link href={accountHref} onClick={closeMenu} className="text-base font-medium text-ink">
              {currentUser ? (isAdmin ? "Panel administración" : "Mi cuenta") : "Ingresar"}
            </Link>
            {currentUser && (
              <button type="button" onClick={handleLogout} className={logoutClassName}>
                Salir
              </button>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
