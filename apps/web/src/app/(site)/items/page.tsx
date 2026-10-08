import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import { parseItemListParams, toItemListQuery } from "@/lib/items";
import { fetchPublishedItems } from "@/lib/public-items-api";

// Public Item layer. Removable as a whole (see CLAUDE.md).

export const metadata: Metadata = {
  title: "Items",
  description: "Items publicados.",
};

export default async function ItemsPage({ searchParams }: PageProps<"/items">) {
  const params = parseItemListParams(await searchParams);
  const { data: items, meta } = await fetchPublishedItems(params);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">Items</h1>

      {items.length === 0 ? (
        <p className="mt-8 rounded-[1.25rem] border border-dashed border-line p-8 text-center text-muted">Aún no hay items publicados.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/items/${item.id}`}
                className="block h-full rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft transition-colors duration-200 hover:border-accent"
              >
                <h2 className="font-display text-xl font-semibold tracking-tight text-ink">{item.title}</h2>
                {item.description && <p className="mt-2 line-clamp-3 text-sm text-muted">{item.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination pathname="/items" searchParams={toItemListQuery(params)} currentPage={meta.page} totalPages={meta.totalPages} />
    </div>
  );
}
