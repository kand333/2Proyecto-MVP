import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import type { PaginatedResponse } from "@portal/shared/pagination";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS, type Product, type ProductStatus } from "@portal/shared/product";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { Price } from "@/components/ui/price";
import { ADMIN_PRODUCTS_PATH, toAdminProductListQuery, type AdminProductListParams } from "@/lib/products";
import { ArchiveProductButton } from "./archive-product-button";

const STATUS_LABELS: Record<ProductStatus, string> = { published: "Publicados", draft: "Borradores", archived: "Archivados" };

function statusBadge(product: Product) {
  if (product.isArchived) return <Badge>Archivado</Badge>;
  return product.isPublished ? <Badge tone="accent">Publicado</Badge> : <Badge>Borrador</Badge>;
}

/** Lowest price among the active variants, or of all when none is active. */
function lowestPrice({ variants }: Product) {
  const candidates = variants.some((variant) => variant.isActive) ? variants.filter((variant) => variant.isActive) : variants;
  return Math.min(...candidates.map((variant) => variant.priceClp));
}

type AdminProductListProps = { result: PaginatedResponse<Product>; params: AdminProductListParams };

/** ADMIN list of products: search and filters in the URL, status, edit and archive (RF-01). */
export function AdminProductList({ result, params }: AdminProductListProps) {
  const { data: products, meta } = result;
  const filtered = Boolean(params.search || params.category || params.status);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">Productos</h1>
        <Link href={`${ADMIN_PRODUCTS_PATH}/new`} className={buttonClassName()}>
          Nuevo producto
        </Link>
      </div>

      <form action={ADMIN_PRODUCTS_PATH} role="search" className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <label htmlFor="admin-product-search" className="sr-only">
          Buscar por nombre
        </label>
        <Input id="admin-product-search" type="search" name="search" defaultValue={params.search} maxLength={MAX_SEARCH_LENGTH} placeholder="Buscar por nombre…" />
        <label htmlFor="admin-product-category" className="sr-only">
          Categoría
        </label>
        <Select id="admin-product-category" name="category" defaultValue={params.category ?? ""}>
          <option value="">Todas las categorías</option>
          {PRODUCT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {PRODUCT_CATEGORY_LABELS[category]}
            </option>
          ))}
        </Select>
        <label htmlFor="admin-product-status" className="sr-only">
          Estado
        </label>
        <Select id="admin-product-status" name="status" defaultValue={params.status ?? ""}>
          <option value="">Activos</option>
          {(Object.keys(STATUS_LABELS) as ProductStatus[]).map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
        <button type="submit" className={buttonClassName("secondary")}>
          Filtrar
        </button>
      </form>

      {products.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line p-8 text-center text-muted">
          {filtered ? "Ningún producto coincide con los filtros." : "Aún no hay productos. Crea el primero."}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-lg border border-line bg-surface px-4 sm:px-6">
          {products.map((product) => (
            <li key={product.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink" title={product.name}>
                  {product.name}
                </p>
                <p className="text-sm text-muted">
                  {PRODUCT_CATEGORY_LABELS[product.category]}, {product.variants.length} {product.variants.length === 1 ? "variante" : "variantes"},{" "}
                  <Price amountClp={lowestPrice(product)} from={product.variants.length > 1} />
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusBadge(product)}
                {product.isFeatured && <Badge tone="offer">Destacado</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Link href={`${ADMIN_PRODUCTS_PATH}/${product.id}/edit`} className={buttonClassName("secondary", "sm")}>
                  Editar
                </Link>
                {!product.isArchived && <ArchiveProductButton id={product.id} name={product.name} />}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination pathname={ADMIN_PRODUCTS_PATH} searchParams={toAdminProductListQuery(params)} currentPage={meta.page} totalPages={meta.totalPages} />
    </div>
  );
}
