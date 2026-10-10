import { MagnifyingGlass } from "@phosphor-icons/react/ssr";
import { PRODUCT_CATEGORY_LABELS } from "@portal/shared/product";
import type { Metadata } from "next";
import Link from "next/link";
import { CatalogFilters } from "@/components/products/catalog-filters";
import { buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ProductCard } from "@/components/ui/product-card";
import { CATALOG_PATH, parseCatalogParams, toCatalogQuery } from "@/lib/products";
import { fetchCatalog } from "@/lib/public-products-api";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Terpenos, cigarrillos electrónicos, líquidos y accesorios con envío a todo Chile.",
};

/** Public catalog (RF-02): category and search in the URL, 12 per page. */
export default async function CatalogPage({ searchParams }: PageProps<"/products">) {
  const params = parseCatalogParams(await searchParams);
  const { data: products, meta } = await fetchCatalog(params);
  const title = params.category ? PRODUCT_CATEGORY_LABELS[params.category] : "Catálogo";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink font-stretch-condensed sm:text-5xl">
        {title}
      </h1>
      <div className="mt-8">
        <CatalogFilters params={params} />
      </div>

      {products.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={MagnifyingGlass}
          title="Sin productos para mostrar"
          description={params.search || params.category ? "Ningún producto coincide con los filtros." : "Pronto publicaremos productos."}
          action={
            params.search || params.category ? (
              <Link href={CATALOG_PATH} className={buttonClassName("secondary")}>
                Ver todo el catálogo
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <li key={product.slug}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}

      <Pagination pathname={CATALOG_PATH} searchParams={toCatalogQuery(params)} currentPage={meta.page} totalPages={meta.totalPages} />
    </div>
  );
}
