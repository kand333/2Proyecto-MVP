import type { ReactNode } from "react";
import { AgeGate } from "@/components/auth/age-gate";
import { SkipLink } from "@/components/layout/skip-link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/** Public site: header, content, footer and the age notice. `/admin` has its own layout instead. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main-content" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
      <AgeGate />
    </>
  );
}
