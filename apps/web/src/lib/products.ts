import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
  type Product,
  type ProductCategory,
  type ProductCreate,
  type ProductStatus,
  type ProductUpdate,
} from "@portal/shared/product";
import { IMAGE_FIELD, type ProductImage } from "@portal/shared/product-image";
import { postForm, sendJson } from "./api-client";
import { parsePageParam } from "./pagination";

export const ADMIN_PRODUCTS_PATH = "/admin/products";

/** Products per page of the admin list. */
export const ADMIN_PRODUCTS_PAGE_SIZE = 10;

/** Admin list state kept in the URL, with the same parameter names as the API. */
export type AdminProductListParams = { page: number; search: string; category?: ProductCategory; status?: ProductStatus };

type PageSearchParams = Record<string, string | string[] | undefined>;

const firstValue = (value: string | string[] | undefined) => {
  const text = (Array.isArray(value) ? value[0] : value)?.trim();
  return text ? text : undefined;
};

const oneOf = <Value extends string>(values: readonly Value[], value: string | undefined): Value | undefined =>
  values.find((candidate) => candidate === value);

/** Reads the list state from the URL; invalid values fall back to the defaults. */
export function parseAdminProductListParams(searchParams: PageSearchParams): AdminProductListParams {
  return {
    page: parsePageParam(firstValue(searchParams.page) ?? null),
    search: (firstValue(searchParams.search) ?? "").slice(0, MAX_SEARCH_LENGTH),
    category: oneOf(PRODUCT_CATEGORIES, firstValue(searchParams.category)),
    status: oneOf(PRODUCT_STATUSES, firstValue(searchParams.status)),
  };
}

/** The same state as a query string, without the defaults (page URL and page links). */
export function toAdminProductListQuery({ page, search, category, status }: AdminProductListParams): URLSearchParams {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (category) query.set("category", category);
  if (status) query.set("status", status);
  if (page > 1) query.set("page", String(page));
  return query;
}

/** REST path of the admin list for that state. */
export function buildAdminProductListApiPath(params: AdminProductListParams): string {
  const query = toAdminProductListQuery(params);
  query.set("pageSize", String(ADMIN_PRODUCTS_PAGE_SIZE));
  return `/api/admin/products?${query}`;
}

export const CATALOG_PATH = "/products";

/** Products per page of the public catalog (RF-02). */
export const CATALOG_PAGE_SIZE = 12;

/** Public catalog state kept in the URL, with the same parameter names as the API (RF-02). */
export type CatalogParams = { page: number; search: string; category?: ProductCategory };

export function parseCatalogParams(searchParams: PageSearchParams): CatalogParams {
  const { page, search, category } = parseAdminProductListParams(searchParams);
  return { page, search, category };
}

export function toCatalogQuery({ page, search, category }: CatalogParams): URLSearchParams {
  return toAdminProductListQuery({ page, search, category });
}

/** REST path of the public list; `featured` asks only for the home page collection (RF-27). */
export function buildCatalogApiPath(params: CatalogParams, options: { featured?: boolean } = {}): string {
  const query = toCatalogQuery(params);
  if (options.featured) query.set("featured", "true");
  query.set("pageSize", String(CATALOG_PAGE_SIZE));
  return `/api/products?${query}`;
}

/** Suggested slug for a name: "Terpeno Limón 5 ml" → "terpeno-limon-5-ml". */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const createProduct = (data: ProductCreate) => sendJson<Product>("POST", "/api/admin/products", data);

export const updateProduct = (id: string, data: ProductUpdate) => sendJson<Product>("PATCH", `/api/admin/products/${id}`, data);

/** Uploads one photo; the API validates type and size by content (RF-21). */
export function uploadProductImage(productId: string, file: File) {
  const body = new FormData();
  body.set(IMAGE_FIELD, file);
  return postForm<ProductImage>(`/api/admin/products/${productId}/images`, body);
}

export const deleteProductImage = (productId: string, imageId: string) =>
  sendJson<void>("DELETE", `/api/admin/products/${productId}/images/${imageId}`);

/** DELETE archives the product (orders keep pointing at its variants). */
export const archiveProduct = (id: string) => sendJson<void>("DELETE", `/api/admin/products/${id}`);
