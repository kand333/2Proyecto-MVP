"use client";

import { ALLOWED_TRANSITIONS, TRACKING_NUMBER_MAX_LENGTH, type OrderStatus } from "@portal/shared/order";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input } from "@/components/ui/field";
import { ApiClientError } from "@/lib/api-client";
import { STATUS_ACTIONS, changeOrderStatus } from "@/lib/admin-orders";
import { flash } from "@/lib/flash";

/**
 * Only the valid next statuses of RF-15 as buttons. Shipping asks for the tracking number; cancelling
 * asks for confirmation (it puts the stock back and frees the code).
 */
export function OrderStatusActions({ orderId, number, status }: { orderId: string; number: number; status: OrderStatus }) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [error, setError] = useState<{ field?: "trackingNumber"; message: string } | null>(null);
  const [pending, setPending] = useState<OrderStatus | null>(null);
  const targets = ALLOWED_TRANSITIONS[status];

  if (targets.length === 0) return <p className="text-sm text-muted">Este pedido ya no admite cambios de estado.</p>;

  async function apply(target: OrderStatus) {
    if (target === "SHIPPED" && !trackingNumber.trim()) {
      setError({ field: "trackingNumber", message: "Ingresa el número de seguimiento" });
      return;
    }
    if (target === "CANCELLED") {
      const accepted = await confirm({
        title: `¿Cancelar el pedido N.º ${number}?`,
        message: "Se repone el stock y el código de descuento vuelve a estar disponible. No se puede deshacer.",
        confirmLabel: "Cancelar pedido",
        tone: "danger",
      });
      if (!accepted) return;
    }
    setError(null);
    setPending(target);
    try {
      await changeOrderStatus(orderId, { status: target, trackingNumber: target === "SHIPPED" ? trackingNumber.trim() : undefined });
      flash(STATUS_ACTIONS[target].done);
      router.refresh();
    } catch (changeError) {
      setError({ message: changeError instanceof ApiClientError ? changeError.message : "No fue posible cambiar el estado." });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {targets.includes("SHIPPED") && (
        <Field id="tracking-number" label="Número de seguimiento" hint="Obligatorio para marcar enviado." error={error?.field === "trackingNumber" ? error.message : undefined}>
          {(control) => (
            <Input {...control} value={trackingNumber} maxLength={TRACKING_NUMBER_MAX_LENGTH} autoComplete="off" onChange={(event) => setTrackingNumber(event.target.value)} />
          )}
        </Field>
      )}
      <div className="flex flex-wrap gap-3">
        {targets.map((target) => (
          <Button
            key={target}
            variant={target === "CANCELLED" ? "danger" : "primary"}
            loading={pending === target}
            disabled={pending !== null}
            onClick={() => apply(target)}
          >
            {STATUS_ACTIONS[target].label}
          </Button>
        ))}
      </div>
      {error && !error.field && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error.message}
        </p>
      )}
      {dialog}
    </div>
  );
}
