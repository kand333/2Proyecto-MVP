import type { PublicProductSummary } from "@portal/shared/product";
import Image from "next/image";
import Link from "next/link";
import { ProductCarousel } from "@/components/ui/product-carousel";
import type { HomeImage } from "@/lib/home-content";
import { BrandPanel, BrandSymbol } from "./brand-symbol";

const sectionTitleClassName = "font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink font-stretch-condensed sm:text-5xl";

/** Block 3: featured products in a carousel; not rendered without featured products (RF-25). */
export function FeaturedCollection({ title, linkLabel, products }: { title: string; linkLabel: string; products: PublicProductSummary[] }) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby="featured-title" className="mx-auto w-full max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="featured-title" className={sectionTitleClassName}>
          {title}
        </h2>
        <Link href="/products" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
          {linkLabel}
        </Link>
      </div>
      <div className="mt-6">
        <ProductCarousel products={products.slice(0, 8)} label={title} />
      </div>
    </section>
  );
}

/** Block 4: full-bleed yellow band with the brand statement and the logo symbol (where the reference has its mascot). */
export function BrandBand({ statement }: { statement: string }) {
  return (
    <section aria-label="Nuestra marca" className="mt-16 bg-highlight">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-14 sm:px-6 md:flex-row md:gap-12 lg:px-8">
        <BrandSymbol className="w-32 shrink-0 md:w-44" />
        <p className="text-balance text-center font-display text-3xl font-extrabold uppercase leading-[1] tracking-tight text-on-highlight font-stretch-condensed sm:text-4xl lg:text-5xl md:text-left">
          {statement}
        </p>
      </div>
    </section>
  );
}

/** Block 5: a large image (about three quarters) with a short title and paragraph. */
export function SplitFeature({ title, body, image }: { title: string[]; body: string; image: HomeImage | null }) {
  return (
    <section aria-labelledby="split-title" className="grid md:grid-cols-[3fr_1fr] lg:grid-cols-[2.8fr_1fr]">
      <div className="relative aspect-[16/11] md:aspect-auto md:min-h-[32rem]">
        {image ? (
          <Image src={image.src} alt={image.alt} fill sizes="(min-width: 768px) 74vw, 100vw" className="object-cover" />
        ) : (
          <BrandPanel className="absolute inset-0" />
        )}
      </div>
      <div className="flex flex-col justify-center gap-4 px-4 py-12 sm:px-6 md:px-8">
        <h2 id="split-title" className="font-display text-2xl font-extrabold uppercase leading-[1] tracking-tight text-ink font-stretch-condensed sm:text-3xl">
          {title.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>
        <p className="max-w-prose text-sm leading-relaxed text-muted">{body}</p>
      </div>
    </section>
  );
}

/** Block 6: who we are, a short paragraph on paper. */
export function AboutStrip({ text }: { text: string }) {
  return (
    <section aria-label="Quiénes somos" className="bg-paper">
      <p className="mx-auto max-w-[65ch] px-4 py-14 text-center leading-relaxed text-muted sm:px-6">{text}</p>
    </section>
  );
}
