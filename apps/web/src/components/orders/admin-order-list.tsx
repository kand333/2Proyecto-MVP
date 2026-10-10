import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, SHIPPING_METHOD_LABELS, type AdminOrderSummary, type OrderStatus } from "@portal/shared/order";
import type { PaginatedResponse } from "@portal/shared/pagination";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { Price } from "@/components/ui/price";
import { ADMIN_ORDERS_PATH, toAdminOrderListQuery, type AdminOrderListParams } from "@/lib/admin-orders";
import { siteConfig } from "@/lib/site-config";

const dateFormatter = new Intl.DateTimeFormat(siteConfig.locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santiago" });

export const STATUS_TONES: Record<OrderStatus, BadgeTone> = {
  PENDING_PAYMENT: "neutral",
  PAID: "accent",
  SHIPPED: "accent",
  DELIVERED: "success",
  CANCELLED: "danger",
};

/** ADMIN list of orders (RF-15): status filter and search by number or email in the URL. */
export function AdminOrderList({ result, params }: { result: PaginatedResponse<AdminOrderSummary>; params: AdminOrderListParams }) {
  const { data: orders, meta } = result;
  const filtered = Boolean(params.search || params.status);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">Pedidos</h1>

      <form action={ADMIN_ORDERS_PATH} role="search" className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label htmlFor="admin-order-search" className="sr-only">
          Buscar por número o email
        </label>
        <Input id="admin-order-search" type="search" name="search" defaultValue={params.search} maxLength={MAX_SEARCH_LENGTH} placeholder="Número o email…" />
        <label htmlFor="admin-order-status" className="sr-only">
          Estado
        </label>
        <Select id="admin-order-status" name="status" defaultValue={params.status ?? ""}>
          <option value="">Todos los estados</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
        <button type="submit" className={buttonClassName("secondary")}>
          Filtrar
        </button>
      </form>

      {orders.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line p-8 text-center text-muted">
          {filtered ? "Ningún pedido coincide con los filtros." : "Aún no hay pedidos."}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-lg border border-line bg-surface px-4 sm:px-6">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`${ADMIN_ORDERS_PATH}/${order.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 hover:text-accent">
                <span className="w-20 font-semibold tabular-nums text-ink">N.º {order.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{order.name}</span>
                  <span className="block truncate text-sm text-muted">
                    {order.email}, {SHIPPING_METHOD_LABELS[order.shippingMethod]}, <time dateTime={order.createdAt}>{dateFormatter.format(new Date(order.createdAt))}</time>
                  </span>
                </span>
                <Badge tone={STATUS_TONES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
                <Price amountClp={order.totalClp} className="w-24 text-right font-semibold text-ink" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination pathname={ADMIN_ORDERS_PATH} searchParams={toAdminOrderListQuery(params)} currentPage={meta.page} totalPages={meta.totalPages} />
    </div>
  );
}
