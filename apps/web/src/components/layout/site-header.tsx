import { Suspense } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { NavigationLinks } from "./navigation-links";
import { SiteNavigation } from "./site-navigation";

// Rendered in the prerendered HTML until the client knows the current URL.
function SiteNavigationFallback() {
  return (
    <nav aria-label="Principal" className="hidden md:block">
      <NavigationLinks activeHref={null} orientation="horizontal" />
    </nav>
  );
}

/** 72 px header on `surface` (docs/design.md): wordmark, main navigation, and search, account and cart icons. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="relative mx-auto flex h-18 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Wordmark />
        <Suspense fallback={<SiteNavigationFallback />}>
          <SiteNavigation />
        </Suspense>
      </div>
    </header>
  );
}
