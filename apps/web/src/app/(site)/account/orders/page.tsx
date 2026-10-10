import { Package } from "@phosphor-icons/react/ssr";
import { ORDER_STATUS_LABELS, type AccountOrderSummary } from "@portal/shared/order";
import type { Metadata } from "next";
import Link from "next/link";
import { STATUS_TONES } from "@/components/orders/admin-order-list";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Price } from "@/components/ui/price";
import { fetchWithSession, requireCustomerUser } from "@/lib/session";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Mis pedidos",
  robots: { index: false },
};

const dateFormatter = new Intl.DateTimeFormat(siteConfig.locale, { dateStyle: "medium", timeZone: "America/Santiago" });

/** The customer's orders (RF-16); guest orders with the same email are not linked. */
export default async function AccountOrdersPage() {
  await requireCustomerUser("/account/orders", "/admin/orders");
  const orders = await fetchWithSession<AccountOrderSummary[]>("/api/account/orders");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <Link href="/account" className="text-sm font-semibold text-muted underline decoration-accent decoration-1 underline-offset-4 hover:text-ink">
        Volver a mi cuenta
      </Link>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-ink">Mis pedidos</h1>
      {orders.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Package}
          title="Aún no tienes pedidos"
          description="Los pedidos que hagas con tu cuenta aparecerán aquí."
          action={
            <Link href="/products" className={buttonClassName()}>
              Ver catálogo
            </Link>
          }
        />
      ) : (
        <ul className="mt-8 divide-y divide-line rounded-lg border border-line bg-surface px-4 sm:px-6">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/account/orders/${order.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 hover:text-accent">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">Pedido N.º {order.number}</span>
                  <span className="block text-sm text-muted">
                    <time dateTime={order.createdAt}>{dateFormatter.format(new Date(order.createdAt))}</time>, {order.itemCount}{" "}
                    {order.itemCount === 1 ? "producto" : "productos"}
                  </span>
                </span>
                <Badge tone={STATUS_TONES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
                <Price amountClp={order.totalClp} className="w-24 text-right font-semibold text-ink" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
