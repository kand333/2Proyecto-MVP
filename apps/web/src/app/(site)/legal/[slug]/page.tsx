import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LEGAL_DRAFT_NOTICE, legalPages, type LegalSlug } from "@/lib/legal-content";

const isLegalSlug = (slug: string): slug is LegalSlug => slug in legalPages;

/** The four pages are known at build time (RF-18). */
export function generateStaticParams() {
  return Object.keys(legalPages).map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return isLegalSlug(slug) ? { title: legalPages[slug].title, description: legalPages[slug].description } : {};
}

/** Legal page (RF-18), marked as a draft until the legal review. */
export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) notFound();
  const page = legalPages[slug];

  return (
    <article className="mx-auto w-full max-w-[65ch] px-4 pb-20 pt-12 sm:px-6">
      <p role="note" className="mb-6 inline-flex rounded-full border border-ink px-3 py-1 text-xs font-semibold text-ink">
        {LEGAL_DRAFT_NOTICE}
      </p>
      <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink font-stretch-condensed sm:text-5xl">{page.title}</h1>
      <div className="mt-10 flex flex-col gap-8">
        {page.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-3">
            <h2 className="font-display text-xl font-bold text-ink">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
