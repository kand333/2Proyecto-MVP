import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/cn";

type WordmarkProps = {
  /** Adds "COMPANY" below the name, as in the full logo (footer). */
  withCompany?: boolean;
  className?: string;
};

/**
 * Typeset logo: "TERPENE" in accent and the "X" in highlight, wide Archivo (docs/design.md).
 * The X is a logotype, so it is exempt from text contrast; the link carries the accessible name.
 */
export function Wordmark({ withCompany = false, className }: WordmarkProps) {
  return (
    <Link
      href="/"
      translate="no"
      aria-label={`${siteConfig.name}, inicio`}
      className={cn("inline-flex flex-col rounded-sm font-display leading-none", className)}
    >
      <span aria-hidden="true" className="font-stretch-expanded text-2xl font-extrabold tracking-tight">
        <span className="text-accent">TERPENE</span>
        <span className="text-highlight">X</span>
      </span>
      {withCompany && (
        <span aria-hidden="true" className="mt-1.5 text-center text-xs font-medium tracking-[0.4em] text-muted">
          COMPANY
        </span>
      )}
    </Link>
  );
}
