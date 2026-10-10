import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderDetail } from "@/components/checkout/order-detail";
import { fetchOrderByToken } from "@/lib/public-orders-api";

export const metadata: Metadata = {
  title: "Tu pedido",
  // A secret link: never indexed, never sent as referrer.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Confirmation and status of an order by its secret token (RF-09, DEC-007). */
export default async function OrderPage({ params }: PageProps<"/orders/[token]">) {
  const order = await fetchOrderByToken((await params).token);
  if (!order) notFound();

  return (
    <div className="mx-auto w-full max-w-[40rem] px-4 pb-20 pt-12 sm:px-6">
      <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink font-stretch-condensed sm:text-5xl">
        Pedido N.º {order.number}
      </h1>
      <p role="note" className="mt-4 rounded-lg bg-highlight p-4 text-sm font-medium text-on-highlight">
        Guarda este enlace: es la única forma de ver tu pedido si compraste sin cuenta.
      </p>
      <div className="mt-8">
        <OrderDetail order={order} />
      </div>
    </div>
  );
}
