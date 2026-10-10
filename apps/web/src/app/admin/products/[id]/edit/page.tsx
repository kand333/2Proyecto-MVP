import { productIdSchema, type Product } from "@portal/shared/product";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/auth/access-denied";
import { ProductForm } from "@/components/products/product-form";
import { ProductImagesManager } from "@/components/products/product-images-manager";
import { ADMIN_PRODUCTS_PATH } from "@/lib/products";
import { findWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Editar producto | Administración",
  robots: { index: false },
};

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await params;
  if (!(await getAdminUser(`/admin/products/${id}/edit`))) return <AccessDenied />;

  const product = productIdSchema.safeParse(id).success ? await findWithSession<Product>(`/api/admin/products/${id}`) : null;
  if (!product) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <Link href={ADMIN_PRODUCTS_PATH} className="text-sm font-semibold text-muted underline decoration-accent decoration-1 underline-offset-4 hover:text-ink">
        Volver a productos
      </Link>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-ink">Editar producto</h1>
      {product.isArchived && <p className="mt-3 text-sm text-muted">Este producto está archivado: no aparece en el catálogo.</p>}
      <div className="mt-8 space-y-8">
        <ProductImagesManager productId={product.id} productName={product.name} images={product.images} />
        <ProductForm product={product} />
      </div>
    </div>
  );
}
