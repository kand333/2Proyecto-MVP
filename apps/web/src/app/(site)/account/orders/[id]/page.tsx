import { orderIdSchema, type OrderView } from "@portal/shared/order";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderDetail } from "@/components/checkout/order-detail";
import { findWithSession, requireCustomerUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Pedido",
  robots: { index: false },
};

/** Detail of one of the customer's orders (RF-16); someone else's order is a 404. */
export default async function AccountOrderPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  await requireCustomerUser(`/account/orders/${id}`, "/admin/orders");
  const order = orderIdSchema.safeParse(id).success ? await findWithSession<OrderView>(`/api/account/orders/${id}`) : null;
  if (!order) notFound();

  return (
    <div className="mx-auto w-full max-w-[40rem] px-4 pb-20 pt-14 sm:px-6">
      <Link href="/account/orders" className="text-sm font-semibold text-muted underline decoration-accent decoration-1 underline-offset-4 hover:text-ink">
        Volver a mis pedidos
      </Link>
      <h1 className="mt-4 font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink font-stretch-condensed sm:text-5xl">
        Pedido N.º {order.number}
      </h1>
      <div className="mt-8">
        <OrderDetail order={order} />
      </div>
    </div>
  );
}
