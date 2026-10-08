import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MAX_SEARCH_LENGTH } from "./limits";

/** Query parameters shared by every paginated list (`?page=2&pageSize=12&search=…`). */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  // Free text. An empty value means "no search".
  search: z
    .string()
    .trim()
    .max(MAX_SEARCH_LENGTH)
    .transform((value) => value || undefined)
    .optional(),
});
export type PaginationQuery = z.output<typeof paginationQuerySchema>;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<Item> = {
  data: Item[];
  meta: PaginationMeta;
};
