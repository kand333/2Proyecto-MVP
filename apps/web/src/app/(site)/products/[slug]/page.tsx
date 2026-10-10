import { PRODUCT_CATEGORY_LABELS } from "@portal/shared/product";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HealthWarning, NICOTINE_CATEGORIES } from "@/components/products/health-warning";
import { ProductGallery } from "@/components/products/product-gallery";
import { VariantPicker } from "@/components/products/variant-picker";
import { CATALOG_PATH } from "@/lib/products";
import { fetchPublicProduct } from "@/lib/public-products-api";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await fetchPublicProduct((await params).slug);
  return product ? { title: product.name, description: product.description.slice(0, 160) || undefined } : {};
}

/** Product page (RF-03): gallery left, information right (one column on mobile). */
export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const product = await fetchPublicProduct((await params).slug);
  if (!product) notFound();

  return (
    <article className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <nav aria-label="Ruta" className="text-sm text-muted">
        <Link href={CATALOG_PATH} className="underline-offset-4 hover:text-ink hover:underline">
          Catálogo
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={`${CATALOG_PATH}?category=${product.category}`} className="underline-offset-4 hover:text-ink hover:underline">
          {PRODUCT_CATEGORY_LABELS[product.category]}
        </Link>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-6">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{product.name}</h1>
          <VariantPicker variants={product.variants} />
          {NICOTINE_CATEGORIES.includes(product.category) && <HealthWarning />}
          {product.description && <p className="max-w-prose whitespace-pre-line leading-relaxed text-muted">{product.description}</p>}
        </div>
      </div>
    </article>
  );
}
