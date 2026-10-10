import type { PaginatedResponse } from "@portal/shared/pagination";
import { productSlugSchema, type PublicProduct, type PublicProductSummary } from "@portal/shared/product";
import { apiInternalUrl } from "./api-internal-url";
import { buildCatalogApiPath, type CatalogParams } from "./products";

// Public catalog, for Server Components (pattern of public-items-api.ts).

async function getPublic(path: string): Promise<Response> {
  // Admin edits, stock and unpublishing must show up immediately.
  return fetch(`${apiInternalUrl()}${path}`, { headers: { Accept: "application/json" }, cache: "no-store" });
}

/** Visible products for that state. Throws so the error boundary can offer a retry. */
export async function fetchCatalog(params: CatalogParams, options: { featured?: boolean } = {}): Promise<PaginatedResponse<PublicProductSummary>> {
  const response = await getPublic(buildCatalogApiPath(params, options));
  if (!response.ok) throw new Error(`No fue posible cargar el catálogo (HTTP ${response.status})`);
  return response.json() as Promise<PaginatedResponse<PublicProductSummary>>;
}

/** A visible product, or null when it does not exist, is not visible or the slug is invalid (a 404 page). */
export async function fetchPublicProduct(slug: string): Promise<PublicProduct | null> {
  if (!productSlugSchema.safeParse(slug).success) return null;
  const response = await getPublic(`/api/products/${slug}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`No fue posible cargar el producto (HTTP ${response.status})`);
  return response.json() as Promise<PublicProduct>;
}
