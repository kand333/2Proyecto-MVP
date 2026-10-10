import type { Metadata } from "next";
import Link from "next/link";
import { AccessDenied } from "@/components/auth/access-denied";
import { ProductForm } from "@/components/products/product-form";
import { ADMIN_PRODUCTS_PATH } from "@/lib/products";
import { getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Nuevo producto | Administración",
  robots: { index: false },
};

export default async function NewProductPage() {
  if (!(await getAdminUser("/admin/products/new"))) return <AccessDenied />;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <Link href={ADMIN_PRODUCTS_PATH} className="text-sm font-semibold text-muted underline decoration-accent decoration-1 underline-offset-4 hover:text-ink">
        Volver a productos
      </Link>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-ink">Nuevo producto</h1>
      <div className="mt-8">
        <ProductForm />
      </div>
    </div>
  );
}
