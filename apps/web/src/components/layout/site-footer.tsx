import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { navigationItems } from "./navigation-items";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <p translate="no" className="font-display text-xl font-semibold tracking-tight text-ink">
            {siteConfig.name}
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted">{siteConfig.description}</p>
        </div>
        <nav aria-label="Pie de página" className="md:justify-self-end">
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded-sm text-muted transition-colors duration-200 hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-muted sm:px-6 lg:px-8">
          © {currentYear} {siteConfig.name}.
        </p>
      </div>
    </footer>
  );
}
