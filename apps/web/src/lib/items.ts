import type { Item, ItemCreate, ItemUpdate } from "@portal/shared/item";
import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import { sendJson } from "./api-client";
import { parsePageParam } from "./pagination";

export const ADMIN_ITEMS_PATH = "/admin/items";

/** Items per page of the admin list. */
export const ADMIN_ITEMS_PAGE_SIZE = 10;

/** List state kept in the URL, with the same parameter names as the API. */
export type ItemListParams = { page: number; search: string };

type PageSearchParams = Record<string, string | string[] | undefined>;

const firstValue = (value: string | string[] | undefined) => {
  const text = (Array.isArray(value) ? value[0] : value)?.trim();
  return text ? text : undefined;
};

/** Reads the list state from the URL; invalid values fall back to the defaults. */
export function parseItemListParams(searchParams: PageSearchParams): ItemListParams {
  return {
    page: parsePageParam(firstValue(searchParams.page) ?? null),
    search: (firstValue(searchParams.search) ?? "").slice(0, MAX_SEARCH_LENGTH),
  };
}

/** The same state as a query string, without the defaults (page URL and page links). */
export function toItemListQuery({ page, search }: ItemListParams): URLSearchParams {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (page > 1) query.set("page", String(page));
  return query;
}

/** REST path of a list endpoint for that state. */
export function buildItemListApiPath(endpoint: string, params: ItemListParams, pageSize: number): string {
  const query = toItemListQuery(params);
  query.set("pageSize", String(pageSize));
  return `${endpoint}?${query}`;
}

export const createItem = (data: ItemCreate) => sendJson<Item>("POST", "/api/admin/items", data);

export const updateItem = (id: string, data: ItemUpdate) => sendJson<Item>("PATCH", `/api/admin/items/${id}`, data);

export const deleteItem = (id: string) => sendJson<void>("DELETE", `/api/admin/items/${id}`);
