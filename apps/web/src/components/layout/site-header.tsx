import Link from "next/link";
import { Suspense } from "react";
import { siteConfig } from "@/lib/site-config";
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

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-paper/75 backdrop-blur-xl">
      <div className="relative mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          translate="no"
          className="font-display text-2xl font-semibold tracking-tight text-ink"
        >
          {siteConfig.name}
        </Link>
        <Suspense fallback={<SiteNavigationFallback />}>
          <SiteNavigation />
        </Suspense>
      </div>
    </header>
  );
}
