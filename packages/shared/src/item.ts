import { z } from "zod";
import { paginationQuerySchema } from "./pagination";

// Example module (see CLAUDE.md, «Nuevo módulo»): contract of the Item REST endpoints.

export const ITEM_TITLE_MAX_LENGTH = 120;
export const ITEM_DESCRIPTION_MAX_LENGTH = 5000;

export const itemIdSchema = z.uuid();

const itemFields = {
  title: z
    .string({ error: "Ingresa un título" })
    .trim()
    .min(1, { error: "Ingresa un título" })
    .max(ITEM_TITLE_MAX_LENGTH, { error: `El título admite hasta ${ITEM_TITLE_MAX_LENGTH} caracteres` }),
  description: z
    .string({ error: "Descripción inválida" })
    .trim()
    .max(ITEM_DESCRIPTION_MAX_LENGTH, { error: `La descripción admite hasta ${ITEM_DESCRIPTION_MAX_LENGTH} caracteres` }),
  isPublished: z.boolean({ error: "Estado de publicación inválido" }),
};

/** Body of `POST /api/admin/items`. */
export const itemCreateSchema = z.object({
  title: itemFields.title,
  description: itemFields.description.default(""),
  isPublished: itemFields.isPublished.default(false),
});
export type ItemCreate = z.output<typeof itemCreateSchema>;

/** Body of `PATCH /api/admin/items/{id}`: any of the fields. */
export const itemUpdateSchema = z
  .object({
    title: itemFields.title.optional(),
    description: itemFields.description.optional(),
    isPublished: itemFields.isPublished.optional(),
  })
  .refine((update) => Object.values(update).some((value) => value !== undefined), {
    error: "Indica qué cambiar",
  });
export type ItemUpdate = z.output<typeof itemUpdateSchema>;

/** Query of `GET /api/items` and `GET /api/admin/items`: page and search over the title. */
export const itemListQuerySchema = paginationQuerySchema;
export type ItemListQuery = z.output<typeof itemListQuerySchema>;

export type Item = {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};
