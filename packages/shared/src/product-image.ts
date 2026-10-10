// Contract of the product photo endpoints (RF-21, DEC-012, docs/recipes/cloudinary.md).

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCT_IMAGES = 8;
/** Multipart field of `POST /api/admin/products/{id}/images`. */
export const IMAGE_FIELD = "file";

/** Type by the first bytes (magic number), never by name or MIME: a renamed PDF is rejected. */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  const startsWith = (signature: number[], offset = 0) => signature.every((byte, index) => bytes[offset + index] === byte);
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

/** A product photo. The first one (position 0) is the cover of the catalog card. */
export type ProductImage = { id: string; url: string; position: number };
