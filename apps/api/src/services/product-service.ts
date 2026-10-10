import "server-only";
import {
  Prisma,
  type Product as ProductRecord,
  type ProductImage as ImageRecord,
  type ProductVariant as VariantRecord,
} from "@/generated/prisma/client";
import { ApiError } from "@/lib/http/api-error";
import {
  findProductById,
  findProducts,
  findTakenSku,
  insertProduct,
  isSlugTaken,
  productSearchWhere,
  updateProduct,
} from "@/repositories/product-repository";
import type { PaginatedResponse } from "@portal/shared/pagination";
import type { AdminProductListQuery, Product, ProductCreate, ProductUpdate } from "@portal/shared/product";

export const PRODUCT_NOT_FOUND = "Producto no encontrado";
export const SLUG_IN_USE = "Ese slug ya lo usa otro producto";
export const skuInUse = (sku: string) => `El SKU ${sku} ya lo usa otro producto`;

type ProductWithVariants = ProductRecord & { variants: VariantRecord[]; images: ImageRecord[] };

export const toProductImage = ({ id, url, position }: ImageRecord) => ({ id, url, position });

export const toProduct = ({ createdAt, updatedAt, variants, images, ...product }: ProductWithVariants): Product => ({
  ...product,
  images: images.map(toProductImage),
  variants: variants.map(({ id, name, sku, priceClp, compareAtPriceClp, stock, isActive, position }) => ({
    id,
    name,
    sku,
    priceClp,
    compareAtPriceClp,
    stock,
    isActive,
    position,
  })),
  createdAt: createdAt.toISOString(),
  updatedAt: updatedAt.toISOString(),
});

/** Search over the name (every word must appear), category and status; archived only with `status=archived`. */
function productFilterOf({ search, category, featured, status }: AdminProductListQuery): Prisma.ProductWhereInput {
  return {
    ...productSearchWhere((search ?? "").trim().split(/\s+/).filter(Boolean)),
    ...(category ? { category } : {}),
    ...(featured === undefined ? {} : { isFeatured: featured }),
    isArchived: status === "archived",
    ...(status === "published" ? { isPublished: true } : status === "draft" ? { isPublished: false } : {}),
  };
}

/** 409 before writing, so the admin sees which field repeats (slug or the SKU). */
async function assertUnique(slug: string | undefined, skus: string[] | undefined, productId?: string) {
  if (slug && (await isSlugTaken(slug, productId))) throw new ApiError(409, SLUG_IN_USE);
  const takenSku = skus?.length ? await findTakenSku(skus, productId) : null;
  if (takenSku) throw new ApiError(409, skuInUse(takenSku));
}

/** Maps a missing product to 404 and a unique-constraint race to 409. */
async function write<Result>(action: () => Promise<Result>): Promise<Result> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new ApiError(404, PRODUCT_NOT_FOUND);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "El slug o un SKU ya lo usa otro producto");
    }
    throw error;
  }
}

/** ADMIN list: newest first, with their variants. */
export async function listProducts(query: AdminProductListQuery): Promise<PaginatedResponse<Product>> {
  const { page, pageSize } = query;
  const { records, total } = await findProducts(productFilterOf(query), { skip: (page - 1) * pageSize, take: pageSize });
  return { data: records.map(toProduct), meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function getProduct(id: string): Promise<Product> {
  const record = await findProductById(id);
  if (!record) throw new ApiError(404, PRODUCT_NOT_FOUND);
  return toProduct(record);
}

export async function createProduct({ variants, ...data }: ProductCreate): Promise<Product> {
  await assertUnique(data.slug, variants.map((variant) => variant.sku));
  return toProduct(await write(() => insertProduct(data, variants)));
}

export async function changeProduct(id: string, { variants, ...data }: ProductUpdate): Promise<Product> {
  await assertUnique(data.slug, variants?.map((variant) => variant.sku), id);
  return toProduct(await write(() => updateProduct(id, data, variants)));
}

/** DELETE archives: orders keep pointing at its variants. Archived products leave the public catalog. */
export async function archiveProduct(id: string): Promise<void> {
  await write(() => updateProduct(id, { isArchived: true }));
}
