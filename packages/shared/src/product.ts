import { z } from "zod";
import { paginationQuerySchema } from "./pagination";

// Contract of the catalog REST endpoints (RF-01, RF-02, RF-03). Prices are whole CLP (DEC-003).

/** Must match the Prisma enum `ProductCategory` (DEC-005). */
export const PRODUCT_CATEGORIES = ["TERPENES", "VAPES", "E_LIQUIDS", "ACCESSORIES"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  TERPENES: "Terpenos",
  VAPES: "Cigarrillos electrónicos",
  E_LIQUIDS: "Líquidos",
  ACCESSORIES: "Accesorios",
};

export const PRODUCT_NAME_MAX_LENGTH = 120;
export const PRODUCT_SLUG_MAX_LENGTH = 80;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 5000;
export const VARIANT_NAME_MAX_LENGTH = 60;
export const VARIANT_SKU_MAX_LENGTH = 40;
export const MIN_PRODUCT_VARIANTS = 1;
export const MAX_PRODUCT_VARIANTS = 20;
export const MAX_PRICE_CLP = 10_000_000;
export const MAX_VARIANT_STOCK = 100_000;
/** The public catalog shows "últimas unidades" at or below this stock, and never the exact stock above it. */
export const LOW_STOCK_THRESHOLD = 10;

export const productIdSchema = z.uuid();

/** Lowercase words joined by hyphens, as in `/products/terpeno-limon`. */
export const productSlugSchema = z
  .string({ error: "Ingresa un slug" })
  .trim()
  .min(1, { error: "Ingresa un slug" })
  .max(PRODUCT_SLUG_MAX_LENGTH, { error: `El slug admite hasta ${PRODUCT_SLUG_MAX_LENGTH} caracteres` })
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Usa solo minúsculas, números y guiones (por ejemplo terpeno-limon)" });

const categorySchema = z.enum(PRODUCT_CATEGORIES, { error: "Categoría inválida" });

/** One variant of a product. The SKU is stored trimmed and uppercase, so "ab-1" and "AB-1" are the same. */
export const productVariantSchema = z.object({
  name: z
    .string({ error: "Ingresa el nombre de la variante" })
    .trim()
    .min(1, { error: "Ingresa el nombre de la variante" })
    .max(VARIANT_NAME_MAX_LENGTH, { error: `El nombre de la variante admite hasta ${VARIANT_NAME_MAX_LENGTH} caracteres` }),
  sku: z
    .string({ error: "Ingresa el SKU" })
    .trim()
    .toUpperCase()
    .min(1, { error: "Ingresa el SKU" })
    .max(VARIANT_SKU_MAX_LENGTH, { error: `El SKU admite hasta ${VARIANT_SKU_MAX_LENGTH} caracteres` })
    .regex(/^[A-Z0-9][A-Z0-9_-]*$/, { error: "El SKU admite solo letras, números, guiones y guiones bajos" }),
  priceClp: z
    .number({ error: "Ingresa el precio en pesos" })
    .int({ error: "El precio debe ser un número entero de pesos" })
    .positive({ error: "El precio debe ser mayor que 0" })
    .max(MAX_PRICE_CLP, { error: "El precio es demasiado alto" }),
  stock: z
    .number({ error: "Ingresa el stock" })
    .int({ error: "El stock debe ser un número entero" })
    .min(0, { error: "El stock no puede ser negativo" })
    .max(MAX_VARIANT_STOCK, { error: "El stock es demasiado alto" }),
  isActive: z.boolean({ error: "Estado de la variante inválido" }).default(true),
});
export type ProductVariantInput = z.input<typeof productVariantSchema>;
export type ProductVariantData = z.output<typeof productVariantSchema>;

/** 1-20 variants with distinct SKUs. The duplicate is reported on its own `sku` path. */
const variantsSchema = z
  .array(productVariantSchema, { error: "Variantes inválidas" })
  .min(MIN_PRODUCT_VARIANTS, { error: "Agrega al menos una variante" })
  .max(MAX_PRODUCT_VARIANTS, { error: `Un producto admite hasta ${MAX_PRODUCT_VARIANTS} variantes` })
  .superRefine((variants, context) => {
    const seen = new Set<string>();
    variants.forEach((variant, index) => {
      if (seen.has(variant.sku)) {
        context.addIssue({ code: "custom", path: [index, "sku"], message: `El SKU ${variant.sku} está repetido` });
      }
      seen.add(variant.sku);
    });
  });

const productFields = {
  name: z
    .string({ error: "Ingresa un nombre" })
    .trim()
    .min(1, { error: "Ingresa un nombre" })
    .max(PRODUCT_NAME_MAX_LENGTH, { error: `El nombre admite hasta ${PRODUCT_NAME_MAX_LENGTH} caracteres` }),
  slug: productSlugSchema,
  description: z
    .string({ error: "Descripción inválida" })
    .trim()
    .max(PRODUCT_DESCRIPTION_MAX_LENGTH, { error: `La descripción admite hasta ${PRODUCT_DESCRIPTION_MAX_LENGTH} caracteres` }),
  category: categorySchema,
  isPublished: z.boolean({ error: "Estado de publicación inválido" }),
  variants: variantsSchema,
};

/** Body of `POST /api/admin/products`. */
export const productCreateSchema = z.object({
  ...productFields,
  description: productFields.description.default(""),
  isPublished: productFields.isPublished.default(false),
});
export type ProductCreate = z.output<typeof productCreateSchema>;

/**
 * Body of `PATCH /api/admin/products/{id}`: any of the fields. `variants` is the full list: matched
 * by SKU, missing ones are deactivated (never deleted).
 */
export const productUpdateSchema = z
  .object({
    name: productFields.name.optional(),
    slug: productFields.slug.optional(),
    description: productFields.description.optional(),
    category: productFields.category.optional(),
    isPublished: productFields.isPublished.optional(),
    variants: productFields.variants.optional(),
  })
  .refine((update) => Object.values(update).some((value) => value !== undefined), {
    error: "Indica qué cambiar",
  });
export type ProductUpdate = z.output<typeof productUpdateSchema>;

// An empty query value (e.g. "?category=") means the filter is not used.
const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

/** Query of `GET /api/products`: page, search over the name and category (same names as the web URL). */
export const productListQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  category: z.preprocess(emptyToUndefined, categorySchema.optional()),
});
export type ProductListQuery = z.output<typeof productListQuerySchema>;

/** `published` and `draft` leave archived products out; `archived` shows only them. */
export const PRODUCT_STATUSES = ["published", "draft", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** Query of `GET /api/admin/products`: the public filters plus the status. */
export const adminProductListQuerySchema = productListQuerySchema.extend({
  status: z.preprocess(emptyToUndefined, z.enum(PRODUCT_STATUSES, { error: "Estado inválido" }).optional()),
});
export type AdminProductListQuery = z.output<typeof adminProductListQuerySchema>;

export type ProductVariant = {
  id: string;
  name: string;
  sku: string;
  priceClp: number;
  stock: number;
  isActive: boolean;
  position: number;
};

/** A product as the admin sees it, with all its variants. */
export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ProductCategory;
  isPublished: boolean;
  isArchived: boolean;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
};

/** An active variant in the public catalog: no exact stock, only whether it can be bought. */
export type PublicProductVariant = {
  id: string;
  name: string;
  sku: string;
  priceClp: number;
  inStock: boolean;
  /** In stock with LOW_STOCK_THRESHOLD units or fewer. */
  lowStock: boolean;
};

/** A published product in `GET /api/products/{slug}`. */
export type PublicProduct = {
  slug: string;
  name: string;
  description: string;
  category: ProductCategory;
  variants: PublicProductVariant[];
};

/** A card of the catalog list (`GET /api/products`). */
export type PublicProductSummary = {
  slug: string;
  name: string;
  category: ProductCategory;
  /** Lowest price among the active variants. */
  priceFromClp: number;
  inStock: boolean;
};

const clpFormat = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

/** Whole Chilean pesos as shown in the UI: `12990` → `$12.990`. */
export function formatClp(amount: number): string {
  return clpFormat.format(amount);
}
