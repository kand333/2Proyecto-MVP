import { Price } from "@/components/ui/price";

type OrderTotalsProps = { subtotalClp: number; discountClp: number; shippingClp: number; totalClp: number; discountCode?: string | null };

/** Subtotal, discount, shipping and total, as the checkout and the order pages show them (docs/design.md). */
export function OrderTotals({ subtotalClp, discountClp, shippingClp, totalClp, discountCode }: OrderTotalsProps) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted">Subtotal</dt>
        <dd>
          <Price amountClp={subtotalClp} className="text-ink" />
        </dd>
      </div>
      {discountClp > 0 && (
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Descuento{discountCode ? ` (${discountCode})` : ""}</dt>
          <dd className="text-emerald-800 dark:text-emerald-300">
            -<Price amountClp={discountClp} />
          </dd>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <dt className="text-muted">Envío</dt>
        <dd>{shippingClp === 0 ? <span className="text-ink">Gratis</span> : <Price amountClp={shippingClp} className="text-ink" />}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-line pt-3 text-base">
        <dt className="font-semibold text-ink">Total</dt>
        <dd>
          <Price amountClp={totalClp} className="font-semibold text-ink" />
        </dd>
      </div>
    </dl>
  );
}
