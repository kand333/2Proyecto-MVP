import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPublishedItem } from "@/lib/public-items-api";
import { siteConfig } from "@/lib/site-config";

// Public Item layer. Removable as a whole (see CLAUDE.md).

const dateFormatter = new Intl.DateTimeFormat(siteConfig.locale, { dateStyle: "long" });

export async function generateMetadata({ params }: PageProps<"/items/[id]">): Promise<Metadata> {
  const item = await fetchPublishedItem((await params).id);
  return item ? { title: item.title, description: item.description.slice(0, 160) || undefined } : {};
}

export default async function ItemPage({ params }: PageProps<"/items/[id]">) {
  const item = await fetchPublishedItem((await params).id);
  if (!item) notFound();

  return (
    <article className="mx-auto w-full max-w-3xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <Link href="/items" className="text-sm font-semibold text-muted underline decoration-accent decoration-1 underline-offset-4 hover:text-ink">
        Volver a items
      </Link>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-ink">{item.title}</h1>
      <p className="mt-3 text-sm text-muted">
        Publicado el <time dateTime={item.createdAt}>{dateFormatter.format(new Date(item.createdAt))}</time>
      </p>
      {item.description && <p className="mt-8 whitespace-pre-line text-lg text-ink">{item.description}</p>}
    </article>
  );
}
