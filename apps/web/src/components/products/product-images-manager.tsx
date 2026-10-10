"use client";

import { Trash, UploadSimple } from "@phosphor-icons/react";
import { IMAGE_TYPES, MAX_PRODUCT_IMAGES, type ProductImage } from "@portal/shared/product-image";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconButton } from "@/components/ui/icon-button";
import { ApiClientError } from "@/lib/api-client";
import { flash } from "@/lib/flash";
import { deleteProductImage, uploadProductImage } from "@/lib/products";

const ERROR_ID = "product-images-error";

/**
 * Photos of a product in the admin (RF-21): upload JPG, PNG or WebP up to 5 MB (the API checks the
 * content), delete with confirmation. The first photo is the catalog cover.
 */
export function ProductImagesManager({ productId, productName, images }: { productId: string; productName: string; images: ProductImage[] }) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isFull = images.length >= MAX_PRODUCT_IMAGES;

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, MAX_PRODUCT_IMAGES - images.length);
    event.target.value = "";
    if (files.length === 0) return;
    setError(null);
    setIsUploading(true);
    try {
      for (const file of files) await uploadProductImage(productId, file);
      flash(files.length === 1 ? "Foto subida." : `${files.length} fotos subidas.`);
    } catch (uploadError) {
      setError(uploadError instanceof ApiClientError ? uploadError.message : "No fue posible subir la foto. Inténtalo de nuevo.");
    } finally {
      setIsUploading(false);
      router.refresh();
    }
  }

  async function handleDelete(image: ProductImage, index: number) {
    const accepted = await confirm({
      title: `¿Eliminar la foto ${index + 1}?`,
      message: "Se borra de la tienda y de Cloudinary. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      tone: "danger",
    });
    if (!accepted) return;
    try {
      await deleteProductImage(productId, image.id);
      flash("Foto eliminada.");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof ApiClientError ? deleteError.message : "No fue posible eliminar la foto.");
    }
  }

  return (
    <section aria-labelledby="product-images-title" className="space-y-4 rounded-lg border border-line bg-surface p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="product-images-title" className="font-display text-xl font-bold text-ink">
            Fotos
          </h2>
          <p className="text-sm text-muted">
            JPG, PNG o WebP de hasta 5 MB. Hasta {MAX_PRODUCT_IMAGES}; la primera es la portada del catálogo.
          </p>
        </div>
        <label
          className={
            isFull || isUploading
              ? "inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-sm border border-line px-3.5 text-sm font-semibold text-muted opacity-60"
              : "inline-flex h-9 cursor-pointer items-center gap-2 rounded-sm border border-ink px-3.5 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-ink hover:text-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
          }
        >
          <UploadSimple aria-hidden="true" className="size-4" />
          {isUploading ? "Subiendo…" : "Subir fotos"}
          <input
            type="file"
            accept={IMAGE_TYPES.join(",")}
            multiple
            disabled={isFull || isUploading}
            aria-describedby={error ? ERROR_ID : undefined}
            onChange={handleFiles}
            className="sr-only"
          />
        </label>
      </div>

      {error && (
        <p id={ERROR_ID} role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      {images.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">Sin fotos: el catálogo muestra un marcador neutro.</p>
      ) : (
        <ol className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id} className="relative">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-paper">
                <Image src={image.url} alt={`${productName}, foto ${index + 1}`} fill sizes="200px" className="object-cover" />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted">
                <span>{index === 0 ? "Portada" : `Foto ${index + 1}`}</span>
                <IconButton label={`Eliminar foto ${index + 1}`} icon={<Trash />} onClick={() => handleDelete(image, index)} />
              </div>
            </li>
          ))}
        </ol>
      )}
      {dialog}
    </section>
  );
}
