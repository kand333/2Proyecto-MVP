import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const primaryLinkClassName =
  "inline-flex h-12 items-center rounded-full bg-accent px-7 text-sm font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover";
const secondaryLinkClassName =
  "inline-flex h-12 items-center rounded-full border border-line px-7 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink";

/** Landing page: replace it with the project's own. */
export default function HomePage() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl">{siteConfig.name}</h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">{siteConfig.description}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        {/* Public Item layer: remove this link together with app/(site)/items. */}
        <Link href="/items" className={primaryLinkClassName}>
          Ver items
        </Link>
        <Link href="/register" className={secondaryLinkClassName}>
          Crear cuenta
        </Link>
      </div>
    </section>
  );
}
