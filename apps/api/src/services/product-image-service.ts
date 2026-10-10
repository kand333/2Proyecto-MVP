import "server-only";
import { destroyImage, uploadImage } from "@/lib/cloudinary";
import { ApiError } from "@/lib/http/api-error";
import {
  countProductImages,
  deleteProductImage,
  findProductImage,
  insertProductImage,
  productExists,
} from "@/repositories/product-image-repository";
import { PRODUCT_NOT_FOUND, toProductImage } from "@/services/product-service";
import { MAX_IMAGE_BYTES, MAX_PRODUCT_IMAGES, detectImageType, type ProductImage } from "@portal/shared/product-image";

export const IMAGE_NOT_FOUND = "Imagen no encontrada";

/**
 * Validates and uploads one photo (docs/recipes/cloudinary.md): empty 400, too big 413, not an image
 * by its content 415, missing product 404, more than 8 photos 409. The product is checked before
 * uploading; if saving the row fails, the remote asset is destroyed so no orphan is left.
 */
export async function addProductImage(productId: string, file: Blob): Promise<ProductImage> {
  if (file.size === 0) throw new ApiError(400, "Elige una imagen");
  if (file.size > MAX_IMAGE_BYTES) throw new ApiError(413, "La imagen supera los 5 MB");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes.subarray(0, 16));
  if (!type) throw new ApiError(415, "Sube una imagen JPG, PNG o WebP");
  if (!(await productExists(productId))) throw new ApiError(404, PRODUCT_NOT_FOUND);
  if ((await countProductImages(productId)) >= MAX_PRODUCT_IMAGES) {
    throw new ApiError(409, `Un producto admite hasta ${MAX_PRODUCT_IMAGES} fotos`);
  }

  const { url, publicId } = await uploadImage(new Blob([bytes], { type }));
  try {
    return toProductImage(await insertProductImage(productId, url, publicId));
  } catch (error) {
    await destroyImage(publicId).catch((cleanupError: unknown) => console.error("Orphan Cloudinary asset", publicId, cleanupError));
    throw error;
  }
}

/** Deletes in Cloudinary first, then the row: if Cloudinary fails, nothing changes and the admin can retry. */
export async function removeProductImage(productId: string, imageId: string): Promise<void> {
  const image = await findProductImage(productId, imageId);
  if (!image) throw new ApiError(404, IMAGE_NOT_FOUND);
  await destroyImage(image.publicId);
  await deleteProductImage(image.id);
}
