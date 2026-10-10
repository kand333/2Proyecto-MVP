import { ArrowRight } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { HomeImage } from "@/lib/home-content";
import { BrandSymbol } from "./brand-symbol";

type HomeHeroProps = { titleLines: string[]; cta: { label: string; href: string }; image: HomeImage | null };

/**
 * Full-bleed hero (docs/design.md, block 1): background photo with a dark veil for AA, brand headline
 * in 2 lines and one CTA. Without a photo, the accent panel with the logo symbol.
 */
export function HomeHero({ titleLines, cta, image }: HomeHeroProps) {
  return (
    <section aria-labelledby="home-hero-title" className={cn("relative isolate overflow-hidden", !image && "bg-accent")}>
      {image && (
        <>
          <Image src={image.src} alt={image.alt} fill priority sizes="100vw" className="-z-20 object-cover" />
          <div aria-hidden="true" className="absolute inset-y-0 left-0 -z-10 w-full bg-ink/70 sm:w-2/3 dark:bg-paper/70" />
        </>
      )}
      <div className="mx-auto grid min-h-[26rem] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:min-h-[70vh] md:grid-cols-[1.2fr_1fr] lg:px-8">
        <div className="flex flex-col items-start gap-8">
          <h1
            id="home-hero-title"
            className={cn(
              "font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-tight font-stretch-condensed sm:text-6xl lg:text-7xl",
              image ? "text-paper dark:text-ink" : "text-on-accent",
            )}
          >
            {titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <Link href={cta.href} className={buttonClassName("primary", "md", "bg-highlight text-on-highlight hover:bg-highlight/90")}>
            {cta.label}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        {!image && <BrandSymbol priority className="mx-auto hidden w-full max-w-80 md:block" />}
      </div>
    </section>
  );
}
