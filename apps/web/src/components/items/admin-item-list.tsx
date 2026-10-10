import type { Item } from "@portal/shared/item";
import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import type { PaginatedResponse } from "@portal/shared/pagination";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/cn";
import { ADMIN_ITEMS_PATH, toItemListQuery, type ItemListParams } from "@/lib/items";
import { siteConfig } from "@/lib/site-config";
import { DeleteItemButton } from "./delete-item-button";

const dateFormatter = new Intl.DateTimeFormat(siteConfig.locale, { dateStyle: "medium" });

const badgeClassName = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium";

type AdminItemListProps = { result: PaginatedResponse<Item>; params: ItemListParams };

/** ADMIN list of items: search, status, edit and delete. */
export function AdminItemList({ result, params }: AdminItemListProps) {
  const { data: items, meta } = result;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">Items</h1>
        <Link
          href={`${ADMIN_ITEMS_PATH}/new`}
          className="inline-flex h-11 items-center rounded-sm bg-accent px-6 text-sm font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover"
        >
          Nuevo item
        </Link>
      </div>

      <form action={ADMIN_ITEMS_PATH} role="search" className="mt-8 flex flex-wrap gap-3">
        <label htmlFor="admin-item-search" className="sr-only">
          Buscar por título
        </label>
        <input
          id="admin-item-search"
          type="search"
          name="search"
          defaultValue={params.search}
          maxLength={MAX_SEARCH_LENGTH}
          placeholder="Buscar por título…"
          className="h-11 min-w-0 flex-1 rounded-sm border border-line bg-surface px-4 text-ink transition-colors duration-200 hover:border-accent/60 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        />
        <button type="submit" className="h-11 rounded-sm border border-line px-6 text-sm font-semibold text-ink transition-colors duration-200 hover:border-accent">
          Buscar
        </button>
      </form>

      {items.length === 0 ? (
        <p className="mt-6 rounded-[1.25rem] border border-dashed border-line p-8 text-center text-muted">
          {params.search ? "Ningún item coincide con la búsqueda." : "Aún no hay items. Crea el primero."}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-[1.25rem] border border-line bg-surface px-4 shadow-soft sm:px-6">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink" title={item.title}>
                  {item.title}
                </p>
                <p className="text-sm text-muted">
                  Creado el <time dateTime={item.createdAt}>{dateFormatter.format(new Date(item.createdAt))}</time>
                </p>
              </div>
              <span className={cn(badgeClassName, item.isPublished ? "border-accent/40 text-ink" : "border-line text-muted")}>
                {item.isPublished ? "Publicado" : "Borrador"}
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`${ADMIN_ITEMS_PATH}/${item.id}/edit`}
                  className="inline-flex h-9 items-center rounded-sm border border-line px-4 text-sm font-medium text-ink transition-colors duration-200 hover:border-accent"
                >
                  Editar
                </Link>
                <DeleteItemButton id={item.id} title={item.title} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination pathname={ADMIN_ITEMS_PATH} searchParams={toItemListQuery(params)} currentPage={meta.page} totalPages={meta.totalPages} />
    </div>
  );
}
