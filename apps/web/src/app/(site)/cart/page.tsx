import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false },
};

/** Browser cart (RF-06): the lines live in localStorage and are priced by the server quote. */
export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink font-stretch-condensed sm:text-5xl">
        Carrito
      </h1>
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
