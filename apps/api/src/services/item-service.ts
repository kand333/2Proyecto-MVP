import "server-only";
import { Prisma, type Item as ItemRecord } from "@/generated/prisma/client";
import { ApiError } from "@/lib/http/api-error";
import { deleteItem, findItemById, findItems, insertItem, itemSearchWhere, updateItem } from "@/repositories/item-repository";
import type { Item, ItemCreate, ItemListQuery, ItemUpdate } from "@portal/shared/item";
import type { PaginatedResponse } from "@portal/shared/pagination";

export const ITEM_NOT_FOUND = "Item no encontrado";

export const toItem = ({ createdAt, updatedAt, ...item }: ItemRecord): Item => ({
  ...item,
  createdAt: createdAt.toISOString(),
  updatedAt: updatedAt.toISOString(),
});

/** Search over the title: every word must appear. */
export const itemFilterOf = (search: string | undefined) => itemSearchWhere((search ?? "").trim().split(/\s+/).filter(Boolean));

export const pageOf = ({ page, pageSize }: ItemListQuery) => ({ skip: (page - 1) * pageSize, take: pageSize });

export function toItemPage(records: ItemRecord[], total: number, { page, pageSize }: ItemListQuery): PaginatedResponse<Item> {
  return { data: records.map(toItem), meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

/** Maps a write on a missing item to 404. */
async function write<Result>(action: () => Promise<Result>): Promise<Result> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new ApiError(404, ITEM_NOT_FOUND);
    throw error;
  }
}

/** ADMIN list: every item, published or not, newest first. */
export async function listItems(query: ItemListQuery): Promise<PaginatedResponse<Item>> {
  const { records, total } = await findItems(itemFilterOf(query.search), pageOf(query));
  return toItemPage(records, total, query);
}

export async function getItem(id: string): Promise<Item> {
  const record = await findItemById(id);
  if (!record) throw new ApiError(404, ITEM_NOT_FOUND);
  return toItem(record);
}

export async function createItem(data: ItemCreate): Promise<Item> {
  return toItem(await insertItem(data));
}

export async function changeItem(id: string, data: ItemUpdate): Promise<Item> {
  return toItem(await write(() => updateItem(id, data)));
}

export async function removeItem(id: string): Promise<void> {
  await write(() => deleteItem(id));
}
