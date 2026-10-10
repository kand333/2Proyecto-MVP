import type { Metadata } from "next";
import { ContactChannelList } from "@/components/contact/contact-channels";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contacto",
  description: `Canales de contacto de ${siteConfig.name}.`,
};

/** Contact channels from `siteConfig.contact`; empty ones are not shown (RF-28). */
export default function ContactPage() {
  return (
    <section aria-labelledby="contact-title" className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-16 sm:px-6">
      <h1
        id="contact-title"
        className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink font-stretch-condensed sm:text-5xl"
      >
        Contacto
      </h1>
      <ContactChannelList channels={siteConfig.contact} />
    </section>
  );
}
