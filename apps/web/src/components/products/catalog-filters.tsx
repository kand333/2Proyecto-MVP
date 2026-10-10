import { MagnifyingGlass } from "@phosphor-icons/react/ssr";
import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from "@portal/shared/product";
import Link from "next/link";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { CATALOG_PATH, toCatalogQuery, type CatalogParams } from "@/lib/products";

const chipClassName =
  "inline-flex h-10 shrink-0 items-center rounded-sm border px-4 text-sm font-medium transition-colors duration-200";

/** Category chips (links, so the filter lives in the URL) and a search form that keeps the category (RF-02). */
export function CatalogFilters({ params }: { params: CatalogParams }) {
  const hrefFor = (category?: (typeof PRODUCT_CATEGORIES)[number]) => {
    const query = toCatalogQuery({ page: 1, search: params.search, category }).toString();
    return query ? `${CATALOG_PATH}?${query}` : CATALOG_PATH;
  };
  const chips = [{ label: "Todos", category: undefined }, ...PRODUCT_CATEGORIES.map((category) => ({ label: PRODUCT_CATEGORY_LABELS[category], category }))];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <nav aria-label="Categorías" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0">
        <ul className="flex gap-2">
          {chips.map(({ label, category }) => {
            const active = params.category === category;
            return (
              <li key={label}>
                <Link
                  href={hrefFor(category)}
                  aria-current={active ? "page" : undefined}
                  className={cn(chipClassName, active ? "border-ink bg-ink text-paper" : "border-line text-ink hover:border-ink")}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <form action={CATALOG_PATH} role="search" className="relative w-full lg:max-w-xs">
        {params.category && <input type="hidden" name="category" value={params.category} />}
        <label htmlFor="catalog-search" className="sr-only">
          Buscar productos
        </label>
        <Input id="catalog-search" type="search" name="search" defaultValue={params.search} maxLength={MAX_SEARCH_LENGTH} placeholder="Buscar productos…" className="pr-11" />
        <button type="submit" aria-label="Buscar" className="absolute right-0 top-0 inline-flex size-11 items-center justify-center text-muted transition-colors duration-200 hover:text-accent">
          <MagnifyingGlass aria-hidden="true" className="size-5" />
        </button>
      </form>
    </div>
  );
}
