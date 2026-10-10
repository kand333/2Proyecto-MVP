import "server-only";
import { prisma } from "@/lib/prisma";

export function countProductImages(productId: string) {
  return prisma.productImage.count({ where: { productId } });
}

export function productExists(id: string) {
  return prisma.product.count({ where: { id } }).then((count) => count > 0);
}

/** Appended after the current photos: the first one uploaded stays the cover. */
export async function insertProductImage(productId: string, url: string, publicId: string) {
  const last = await prisma.productImage.findFirst({ where: { productId }, orderBy: { position: "desc" }, select: { position: true } });
  return prisma.productImage.create({ data: { productId, url, publicId, position: (last?.position ?? -1) + 1 } });
}

export function findProductImage(productId: string, imageId: string) {
  return prisma.productImage.findFirst({ where: { id: imageId, productId } });
}

export function deleteProductImage(id: string) {
  return prisma.productImage.delete({ where: { id } });
}
