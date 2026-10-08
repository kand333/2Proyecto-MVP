import "server-only";
import { ApiError } from "@/lib/http/api-error";
import { findPublishedItemById, findPublishedItems } from "@/repositories/public-item-repository";
import { ITEM_NOT_FOUND, itemFilterOf, pageOf, toItem, toItemPage } from "@/services/item-service";
import type { Item, ItemListQuery } from "@portal/shared/item";
import type { PaginatedResponse } from "@portal/shared/pagination";

// Public Item layer. Removable as a whole (see CLAUDE.md).

export async function listPublishedItems(query: ItemListQuery): Promise<PaginatedResponse<Item>> {
  const { records, total } = await findPublishedItems(itemFilterOf(query.search), pageOf(query));
  return toItemPage(records, total, query);
}

/** A missing and an unpublished item get the same 404: drafts are never revealed. */
export async function getPublishedItem(id: string): Promise<Item> {
  const record = await findPublishedItemById(id);
  if (!record) throw new ApiError(404, ITEM_NOT_FOUND);
  return toItem(record);
}
