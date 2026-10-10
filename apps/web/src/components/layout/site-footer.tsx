import { FacebookLogo, InstagramLogo } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { iconButtonClassName } from "@/components/ui/icon-button";
import { LEGAL_LINKS } from "@/lib/legal-content";
import { siteConfig } from "@/lib/site-config";
import { navigationItems } from "./navigation-items";

const linkClassName = "rounded-sm text-sm text-muted transition-colors duration-200 hover:text-ink";

/** Social profiles of `siteConfig.social`; the empty ones are not rendered (RF-24). */
function socialLinks() {
  return [
    { href: siteConfig.social.instagram, label: "Instagram", icon: InstagramLogo },
    { href: siteConfig.social.facebook, label: "Facebook", icon: FacebookLogo },
  ].filter((link) => link.href);
}

/** Footer of every public page (docs/design.md): brand, links, legal pages, copyright and social profiles. */
export function SiteFooter({ children }: { children?: ReactNode }) {
  const currentYear = new Date().getFullYear();
  const socials = socialLinks();

  return (
    <footer className="border-t border-line bg-surface">
      {children && <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">{children}</div>}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[auto_1fr_1fr] lg:px-8">
        <Wordmark withCompany className="self-start" />
        <nav aria-label="Pie de página">
          <ul className="flex flex-col gap-2">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClassName}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Legal">
          <ul className="flex flex-col gap-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.slug}>
                <Link href={`/legal/${link.slug}`} className={linkClassName}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-xs text-muted">
            © {currentYear} {siteConfig.name}
          </p>
          {socials.length > 0 && (
            <ul className="flex items-center gap-1">
              {socials.map(({ href, label, icon: IconComponent }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={iconButtonClassName()}>
                    <IconComponent aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
