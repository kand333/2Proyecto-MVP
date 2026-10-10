import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

/** Checkout as a guest or with an account (RF-08). */
export default function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
      <h1 className="mx-auto max-w-[40rem] font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink font-stretch-condensed sm:text-5xl">
        Checkout
      </h1>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
