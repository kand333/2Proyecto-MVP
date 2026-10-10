import { ORDER_STATUS_LABELS, orderIdSchema, type AdminOrder } from "@portal/shared/order";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/auth/access-denied";
import { OrderDetail } from "@/components/checkout/order-detail";
import { OrderStatusActions } from "@/components/orders/order-status-actions";
import { ADMIN_ORDERS_PATH } from "@/lib/admin-orders";
import { findWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Pedido | Administración",
  robots: { index: false },
};

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  if (!(await getAdminUser(`${ADMIN_ORDERS_PATH}/${id}`))) return <AccessDenied />;

  const order = orderIdSchema.safeParse(id).success ? await findWithSession<AdminOrder>(`/api/admin/orders/${id}`) : null;
  if (!order) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <Link href={ADMIN_ORDERS_PATH} className="text-sm font-semibold text-muted underline decoration-accent decoration-1 underline-offset-4 hover:text-ink">
        Volver a pedidos
      </Link>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-ink">Pedido N.º {order.number}</h1>
      <p className="mt-2 text-sm text-muted">
        {order.phone}, {order.hasAccount ? "cliente con cuenta" : "compra como invitado"}
      </p>

      <section aria-labelledby="order-actions" className="mt-8 rounded-lg border border-line bg-surface p-6">
        <h2 id="order-actions" className="font-display text-lg font-bold text-ink">
          Estado: {ORDER_STATUS_LABELS[order.status]}
        </h2>
        <div className="mt-4">
          <OrderStatusActions orderId={order.id} number={order.number} status={order.status} />
        </div>
      </section>

      <div className="mt-8">
        <OrderDetail order={order} showPayment={false} />
      </div>
    </div>
  );
}
