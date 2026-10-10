import type { ReactNode } from "react";
import { AgeGate } from "@/components/auth/age-gate";
import { SkipLink } from "@/components/layout/skip-link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FooterSubscribe } from "@/components/marketing/footer-subscribe";
import { SubscribePopup } from "@/components/marketing/subscribe-popup";

/** Public site: header, content, footer, the age notice and the subscription popup. `/admin` has its own layout instead. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main-content" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter>
        <FooterSubscribe />
      </SiteFooter>
      <AgeGate />
      <SubscribePopup />
    </>
  );
}
