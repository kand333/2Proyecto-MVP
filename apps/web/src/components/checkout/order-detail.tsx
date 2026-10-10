import { CHILE_REGIONS, ORDER_STATUS_LABELS, SHIPPING_METHOD_LABELS, type OrderView } from "@portal/shared/order";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { siteConfig } from "@/lib/site-config";
import { OrderTotals } from "./order-totals";

const dateFormatter = new Intl.DateTimeFormat(siteConfig.locale, { dateStyle: "long", timeZone: "America/Santiago" });

/**
 * An order as its buyer sees it: status, payment instructions, items, totals and delivery (RF-09, RF-16).
 * The admin reuses it without the payment block (`showPayment={false}`).
 */
export function OrderDetail({ order, showPayment = true }: { order: OrderView; showPayment?: boolean }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={order.status === "CANCELLED" ? "danger" : order.status === "PENDING_PAYMENT" ? "neutral" : "success"}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
        <span className="text-sm text-muted">
          Realizado el <time dateTime={order.createdAt}>{dateFormatter.format(new Date(order.createdAt))}</time>
        </span>
      </div>

      {showPayment && order.status === "PENDING_PAYMENT" && (
        <section aria-labelledby="order-payment" className="rounded-lg border-2 border-ink p-5">
          <h2 id="order-payment" className="font-display text-lg font-bold text-ink">
            Paga por transferencia
          </h2>
          <p className="mt-2 text-sm text-ink">
            Transfiere <Price amountClp={order.totalClp} className="font-semibold" /> e indica el pedido N.º {order.number} en el comentario.
          </p>
          <p className="mt-3 whitespace-pre-line text-sm text-ink">
            {order.transferInstructions ?? "Te enviaremos los datos de transferencia a la brevedad."}
          </p>
        </section>
      )}

      {order.trackingNumber && (
        <p className="text-sm text-ink">
          Número de seguimiento: <strong className="font-semibold">{order.trackingNumber}</strong>
        </p>
      )}

      <section aria-labelledby="order-items" className="flex flex-col gap-4">
        <h2 id="order-items" className="font-display text-lg font-bold text-ink">
          Productos
        </h2>
        <ul className="divide-y divide-line border-y border-line text-sm">
          {order.items.map((item) => (
            <li key={item.sku} className="flex justify-between gap-4 py-3">
              <span className="min-w-0 text-ink">
                {item.productName} {item.variantName && <span className="text-muted">({item.variantName})</span>} x {item.quantity}
              </span>
              <Price amountClp={item.lineTotalClp} className="shrink-0 text-ink" />
            </li>
          ))}
        </ul>
        <OrderTotals {...order} />
      </section>

      <section aria-labelledby="order-delivery" className="flex flex-col gap-2 text-sm">
        <h2 id="order-delivery" className="font-display text-lg font-bold text-ink">
          {SHIPPING_METHOD_LABELS[order.shippingMethod]}
        </h2>
        {order.address ? (
          <p className="text-ink">
            {order.address.street}
            {order.address.extra ? `, ${order.address.extra}` : ""}, {order.address.commune}, {CHILE_REGIONS[order.address.region]}
          </p>
        ) : (
          <p className="text-ink">{order.pickupAddress ?? "Te avisaremos la dirección de retiro."}</p>
        )}
        <p className="text-muted">
          {order.name}, {order.email}
        </p>
      </section>
    </div>
  );
}
