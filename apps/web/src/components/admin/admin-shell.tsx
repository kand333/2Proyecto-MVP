"use client";

import type { AuthUser } from "@portal/shared/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { SkipLink } from "@/components/layout/skip-link";
import { adminNavigationItems, getActiveAdminSection, type AdminSection } from "@/lib/admin-navigation";
import { logOut } from "@/lib/auth-client";
import { flash } from "@/lib/flash";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/lib/site-config";

const SIDEBAR_ID = "admin-sidebar";

/** Outline icons drawn inline (no icon library). */
const iconPaths: Record<AdminSection | "site" | "logout" | "collapse" | "menu", string> = {
  dashboard: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
  products: "M4 7.5 12 3l8 4.5v9L12 21l-8-4.5zM4 7.5l8 4.5 8-4.5M12 12v9",
  items: "M4 6h16M4 12h16M4 18h10",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7M22 21a6 6 0 0 0-4-5.6",
  account: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
  site: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  logout: "M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11",
  collapse: "M15 6l-6 6 6 6",
  menu: "M4 7h16M4 12h16M4 17h16",
};

function Icon({ name, className }: { name: keyof typeof iconPaths; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5 shrink-0", className)}
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

const itemClassName =
  "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-accent/60";

type AdminShellProps = { user: AuthUser; children: ReactNode };

/**
 * Corporate frame of /admin: a sidebar on the left (collapsible to icons on desktop, a drawer on
 * phones) and the content on the right. The public header and footer are not used here.
 */
export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const activeSection = getActiveAdminSection(pathname);

  async function handleLogout() {
    await logOut().catch(() => flash("No pudimos cerrar la sesión. Inténtalo de nuevo.", "error"));
    router.push("/");
    router.refresh();
  }

  function handleSidebarKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && isDrawerOpen) setIsDrawerOpen(false);
  }

  // Labels stay in the accessibility tree when collapsed; a tooltip shows them on hover.
  const label = (text: string) => <span className={cn("truncate", isCollapsed && "lg:sr-only")}>{text}</span>;

  return (
    <div className="min-h-dvh bg-paper lg:flex">
      <SkipLink />

      <aside
        id={SIDEBAR_ID}
        aria-label="Administración"
        onKeyDown={handleSidebarKeyDown}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-accent text-on-accent transition-[width,transform] duration-200 motion-reduce:transition-none",
          "lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          isDrawerOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed && "lg:w-[4.5rem]",
        )}
      >
        <div className={cn("flex h-16 items-center gap-2 border-b border-on-accent/15 px-4", isCollapsed && "lg:justify-center lg:px-0")}>
          <Link
            href="/admin"
            onClick={() => setIsDrawerOpen(false)}
            className={cn("min-w-0 flex-1 leading-tight", isCollapsed && "lg:hidden")}
          >
            <span className="block truncate text-sm font-semibold tracking-wide">{siteConfig.name}</span>
            <span className="block text-xs uppercase tracking-[0.18em] text-on-accent/70">Administración</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsCollapsed((previous) => !previous)}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? "Expandir menú" : "Contraer menú"}
            title={isCollapsed ? "Expandir menú" : "Contraer menú"}
            className="hidden size-9 items-center justify-center rounded-lg text-on-accent/80 transition-colors duration-200 hover:bg-on-accent/10 hover:text-on-accent lg:inline-flex"
          >
            <Icon name="collapse" className={cn("transition-transform duration-200 motion-reduce:transition-none", isCollapsed && "rotate-180")} />
          </button>
        </div>

        <nav aria-label="Secciones de administración" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {adminNavigationItems.map((item) => {
              const isActive = item.section === activeSection;
              return (
                <li key={item.section}>
                  <Link
                    href={item.href}
                    onClick={() => setIsDrawerOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      itemClassName,
                      isCollapsed && "lg:justify-center lg:px-0",
                      isActive ? "bg-on-accent/15 text-on-accent" : "text-on-accent/75 hover:bg-on-accent/10 hover:text-on-accent",
                    )}
                  >
                    <Icon name={item.section} />
                    {label(item.label)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-1 border-t border-on-accent/15 px-3 py-4">
          <p className={cn("truncate px-3 pb-2 text-xs text-on-accent/70", isCollapsed && "lg:hidden")} title={user.email}>
            {user.name}
          </p>
          <Link
            href="/"
            title={isCollapsed ? "Ver sitio" : undefined}
            className={cn(itemClassName, "text-on-accent/75 hover:bg-on-accent/10 hover:text-on-accent", isCollapsed && "lg:justify-center lg:px-0")}
          >
            <Icon name="site" />
            {label("Ver sitio")}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? "Salir" : undefined}
            className={cn(
              itemClassName,
              "w-full text-on-accent/75 hover:bg-on-accent/10 hover:text-on-accent",
              isCollapsed && "lg:justify-center lg:px-0",
            )}
          >
            <Icon name="logout" />
            {label("Salir")}
          </button>
        </div>
      </aside>

      {isDrawerOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
          <span className="text-sm font-semibold text-ink">Administración</span>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-expanded={isDrawerOpen}
            aria-controls={SIDEBAR_ID}
            aria-label="Abrir menú de administración"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-line text-ink transition-colors duration-200 hover:border-accent"
          >
            <Icon name="menu" />
          </button>
        </header>
        <main id="main-content" className="flex flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
