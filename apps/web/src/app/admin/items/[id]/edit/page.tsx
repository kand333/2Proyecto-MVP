import { itemIdSchema, type Item } from "@portal/shared/item";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/auth/access-denied";
import { ItemForm } from "@/components/items/item-form";
import { ADMIN_ITEMS_PATH } from "@/lib/items";
import { findWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Editar item | Administración",
  robots: { index: false },
};

export default async function EditItemPage({ params }: PageProps<"/admin/items/[id]/edit">) {
  const { id } = await params;
  if (!(await getAdminUser(`/admin/items/${id}/edit`))) return <AccessDenied />;

  const item = itemIdSchema.safeParse(id).success ? await findWithSession<Item>(`/api/admin/items/${id}`) : null;
  if (!item) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <Link href={ADMIN_ITEMS_PATH} className="text-sm font-semibold text-muted underline decoration-accent decoration-1 underline-offset-4 hover:text-ink">
        Volver a items
      </Link>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-ink">Editar item</h1>
      <div className="mt-8">
        <ItemForm item={item} />
      </div>
    </div>
  );
}
