import "server-only";
import type { ProductImage as ImageRecord, Product as ProductRecord, ProductVariant as VariantRecord } from "@/generated/prisma/client";
import { ApiError } from "@/lib/http/api-error";
import { findVisibleProductBySlug, findVisibleProducts } from "@/repositories/public-product-repository";
import { productSearchWhere } from "@/repositories/product-repository";
import { PRODUCT_NOT_FOUND, toProductImage } from "@/services/product-service";
import type { PaginatedResponse } from "@portal/shared/pagination";
import {
  LOW_STOCK_THRESHOLD,
  type ProductListQuery,
  type PublicProduct,
  type PublicProductSummary,
  type PublicProductVariant,
} from "@portal/shared/product";

type VisibleProduct = ProductRecord & { variants: VariantRecord[]; images: ImageRecord[] };

/** Never the exact stock: only whether it can be bought and whether few units are left. */
const toPublicVariant = ({ id, name, sku, priceClp, compareAtPriceClp, stock }: VariantRecord): PublicProductVariant => ({
  id,
  name,
  sku,
  priceClp,
  compareAtPriceClp,
  inStock: stock > 0,
  lowStock: stock > 0 && stock <= LOW_STOCK_THRESHOLD,
});

/** The card shows the cheapest active variant: its price and, if on offer, its previous price (RF-27). */
function toSummary({ slug, name, category, variants, images }: VisibleProduct): PublicProductSummary {
  const cheapest = variants.reduce((lowest, variant) => (variant.priceClp < lowest.priceClp ? variant : lowest));
  return {
    slug,
    name,
    category,
    priceFromClp: cheapest.priceClp,
    compareAtFromClp: cheapest.compareAtPriceClp,
    inStock: variants.some((variant) => variant.stock > 0),
    coverUrl: images[0]?.url ?? null,
  };
}

export async function listVisibleProducts(query: ProductListQuery): Promise<PaginatedResponse<PublicProductSummary>> {
  const { search, category, featured, page, pageSize } = query;
  const where = {
    ...productSearchWhere((search ?? "").trim().split(/\s+/).filter(Boolean)),
    ...(category ? { category } : {}),
    ...(featured === undefined ? {} : { isFeatured: featured }),
  };
  const { records, total } = await findVisibleProducts(where, { skip: (page - 1) * pageSize, take: pageSize });
  return { data: records.map(toSummary), meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

/** A missing, unpublished or archived product gets the same 404: drafts are never revealed. */
export async function getVisibleProduct(slug: string): Promise<PublicProduct> {
  const record = await findVisibleProductBySlug(slug);
  if (!record) throw new ApiError(404, PRODUCT_NOT_FOUND);
  const { name, description, category, variants, images } = record;
  return { slug: record.slug, name, description, category, variants: variants.map(toPublicVariant), images: images.map(toProductImage) };
}
