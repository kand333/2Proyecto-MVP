"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, type KeyboardEvent } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { logOut } from "@/lib/auth-client";
import { flash } from "@/lib/flash";
import { getActiveNavigationHref } from "./navigation-items";
import { NavigationLinks } from "./navigation-links";

const mobileNavigationId = "mobile-navigation";

export function SiteNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const activeHref = getActiveNavigationHref(pathname);

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
        <NavigationLinks
          activeHref={activeHref}
          orientation="horizontal"
          userName={currentUser?.name}
          isAdmin={currentUser?.role === "ADMIN"}
          onLogout={handleLogout}
        />
      </nav>

      <button
        ref={menuButtonRef}
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-full border border-line text-ink transition-colors duration-200 hover:bg-surface md:hidden"
        aria-expanded={isMenuOpen}
        aria-controls={mobileNavigationId}
        aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          {isMenuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {isMenuOpen && (
        <nav
          id={mobileNavigationId}
          aria-label="Principal"
          className="absolute inset-x-0 top-full border-b border-line/60 bg-paper/95 px-4 py-3 shadow-soft backdrop-blur-xl md:hidden"
          onKeyDown={handleMobileNavigationKeyDown}
        >
          <NavigationLinks
            activeHref={activeHref}
            orientation="vertical"
            onNavigate={closeMenu}
            userName={currentUser?.name}
            isAdmin={currentUser?.role === "ADMIN"}
            onLogout={handleLogout}
          />
        </nav>
      )}
    </>
  );
}
