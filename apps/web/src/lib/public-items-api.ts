import { itemIdSchema, type Item } from "@portal/shared/item";
import type { PaginatedResponse } from "@portal/shared/pagination";
import { apiInternalUrl } from "./api-internal-url";
import { buildItemListApiPath, type ItemListParams } from "./items";

// Public Item layer, for Server Components. Removable as a whole (see CLAUDE.md).

export const PUBLIC_ITEMS_PAGE_SIZE = 12;

async function getPublic(path: string): Promise<Response> {
  // Admin edits and unpublishing must show up immediately.
  return fetch(`${apiInternalUrl()}${path}`, { headers: { Accept: "application/json" }, cache: "no-store" });
}

/** Published items for that page and search. Throws so the error boundary can offer a retry. */
export async function fetchPublishedItems(params: ItemListParams): Promise<PaginatedResponse<Item>> {
  const response = await getPublic(buildItemListApiPath("/api/items", params, PUBLIC_ITEMS_PAGE_SIZE));
  if (!response.ok) throw new Error(`No fue posible cargar los items (HTTP ${response.status})`);
  return response.json() as Promise<PaginatedResponse<Item>>;
}

/** A published item, or null when it does not exist, is not published or the id is invalid (a 404 page). */
export async function fetchPublishedItem(id: string): Promise<Item | null> {
  if (!itemIdSchema.safeParse(id).success) return null;
  const response = await getPublic(`/api/items/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`No fue posible cargar el item (HTTP ${response.status})`);
  return response.json() as Promise<Item>;
}
