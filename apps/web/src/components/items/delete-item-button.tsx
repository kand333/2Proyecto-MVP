"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApiClientError } from "@/lib/api-client";
import { flash } from "@/lib/flash";
import { deleteItem } from "@/lib/items";

/** Deletes an item after a confirmation, then reloads the list. */
export function DeleteItemButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleClick() {
    const accepted = await confirm({
      title: `¿Eliminar «${title}»?`,
      message: "Se borra para siempre. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      tone: "danger",
    });
    if (!accepted) return;

    setIsDeleting(true);
    try {
      await deleteItem(id);
      flash("Item eliminado.");
      router.refresh();
    } catch (error) {
      flash(error instanceof ApiClientError ? error.message : "No fue posible eliminar el item.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDeleting}
        className="inline-flex h-9 items-center rounded-sm border border-line px-4 text-sm font-medium text-ink transition-colors duration-200 hover:border-red-700 hover:text-red-700 disabled:opacity-60 dark:hover:border-red-400 dark:hover:text-red-400"
      >
        Eliminar
      </button>
      {dialog}
    </>
  );
}
