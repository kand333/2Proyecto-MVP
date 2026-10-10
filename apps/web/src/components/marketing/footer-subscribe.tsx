import { WELCOME_DISCOUNT_PERCENT } from "@portal/shared/subscriber";
import { SubscribeForm } from "./subscribe-form";

/** Subscription block of the footer (RF-26, docs/design.md): the same form and API call as the popup. */
export function FooterSubscribe() {
  return (
    <section aria-labelledby="footer-subscribe-title" className="grid gap-6 border-b border-line pb-12 md:grid-cols-2 md:items-end">
      <div>
        <h2
          id="footer-subscribe-title"
          className="font-display text-3xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink font-stretch-condensed sm:text-4xl"
        >
          {WELCOME_DISCOUNT_PERCENT} % en tu primer pedido
        </h2>
        <p className="mt-2 text-sm text-muted">Suscríbete y recibe tu código de bienvenida al instante.</p>
      </div>
      <SubscribeForm variant="underline" />
    </section>
  );
}
