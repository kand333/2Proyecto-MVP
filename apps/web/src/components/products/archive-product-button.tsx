"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApiClientError } from "@/lib/api-client";
import { flash } from "@/lib/flash";
import { archiveProduct } from "@/lib/products";

/** Archives a product after a confirmation, then reloads the list. */
export function ArchiveProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const [isArchiving, setIsArchiving] = useState(false);

  async function handleClick() {
    const accepted = await confirm({
      title: `¿Archivar «${name}»?`,
      message: "Sale del catálogo y del listado. Los pedidos que lo incluyen se conservan.",
      confirmLabel: "Archivar",
      tone: "danger",
    });
    if (!accepted) return;

    setIsArchiving(true);
    try {
      await archiveProduct(id);
      flash("Producto archivado.");
      router.refresh();
    } catch (error) {
      flash(error instanceof ApiClientError ? error.message : "No fue posible archivar el producto.", "error");
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={handleClick} loading={isArchiving}>
        Archivar
      </Button>
      {dialog}
    </>
  );
}
