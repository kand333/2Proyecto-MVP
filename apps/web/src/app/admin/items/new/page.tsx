import type { Metadata } from "next";
import Link from "next/link";
import { AccessDenied } from "@/components/auth/access-denied";
import { ItemForm } from "@/components/items/item-form";
import { ADMIN_ITEMS_PATH } from "@/lib/items";
import { getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Nuevo item | Administración",
  robots: { index: false },
};

export default async function NewItemPage() {
  if (!(await getAdminUser("/admin/items/new"))) return <AccessDenied />;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <Link href={ADMIN_ITEMS_PATH} className="text-sm font-semibold text-muted underline decoration-accent decoration-1 underline-offset-4 hover:text-ink">
        Volver a items
      </Link>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-ink">Nuevo item</h1>
      <div className="mt-8">
        <ItemForm />
      </div>
    </div>
  );
}
