"use client";

import { ShoppingBag, Trash } from "@phosphor-icons/react";
import { MAX_LINE_QUANTITY, type CartLine, type Quote, type QuoteLine } from "@portal/shared/order";
import Link from "next/link";
import useSWR from "swr";
import { buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Price } from "@/components/ui/price";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { removeFromCart, setCartQuantity } from "@/lib/cart";
import { fetchQuote } from "@/lib/checkout";

const ISSUE_TEXT: Record<NonNullable<QuoteLine["issue"]>, string> = {
  UNAVAILABLE: "Ya no está disponible. Quítalo para continuar.",
  INSUFFICIENT_STOCK: "No hay stock para esa cantidad. Baja la cantidad o quítalo.",
};

const quantities = Array.from({ length: MAX_LINE_QUANTITY }, (_, index) => index + 1);

function CartLineRow({ line, cartLine }: { line: QuoteLine; cartLine: CartLine }) {
  const selectId = `quantity-${line.variantId}`;
  return (
    <li className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 py-5 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
      <div className="min-w-0">
        <p className="font-medium text-ink">{line.productName}</p>
        {line.variantName && <p className="text-sm text-muted">{line.variantName}</p>}
        {line.issue && (
          <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">
            {ISSUE_TEXT[line.issue]}
          </p>
        )}
      </div>
      <div className="row-start-2 flex items-center gap-2 sm:row-start-auto">
        <label htmlFor={selectId} className="sr-only">
          Cantidad de {line.productName}
        </label>
        <Select id={selectId} value={cartLine.quantity} onChange={(event) => setCartQuantity(line.variantId, Number(event.target.value))} className="w-20">
          {quantities.map((quantity) => (
            <option key={quantity} value={quantity}>
              {quantity}
            </option>
          ))}
        </Select>
      </div>
      <Price amountClp={line.lineTotalClp} className="text-right font-semibold text-ink sm:min-w-24" />
      <IconButton label={`Quitar ${line.productName} del carrito`} icon={<Trash />} onClick={() => removeFromCart(line.variantId)} className="justify-self-end" />
    </li>
  );
}

/** The cart page (RF-06): lines priced by the server quote, quantity 1-10, remove, and the subtotal. */
export function CartView() {
  const lines = useCart();
  const { data: quote, error } = useSWR<Quote, Error>(
    lines.length > 0 ? ["cart-quote", JSON.stringify(lines)] : null,
    () => fetchQuote({ lines, shippingMethod: "PICKUP" }),
    { keepPreviousData: true },
  );

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Tu carrito está vacío"
        description="Explora el catálogo y añade lo que quieras comprar."
        action={
          <Link href="/products" className={buttonClassName()}>
            Ver catálogo
          </Link>
        }
      />
    );
  }

  if (error && !quote) {
    return (
      <p role="alert" className="rounded-lg border border-line p-6 text-red-700 dark:text-red-400">
        No pudimos calcular tu carrito. Revisa tu conexión y recarga la página.
      </p>
    );
  }

  if (!quote) {
    return (
      <div aria-hidden="true" className="space-y-4">
        {lines.map((line) => (
          <Skeleton key={line.variantId} className="h-16" />
        ))}
      </div>
    );
  }

  const byVariant = new Map(lines.map((line) => [line.variantId, line]));
  return (
    <div className="grid gap-10 pb-28 lg:grid-cols-[1fr_20rem] lg:pb-0">
      <ul className="divide-y divide-line border-y border-line">
        {quote.lines.map((line) => {
          const cartLine = byVariant.get(line.variantId);
          return cartLine ? <CartLineRow key={line.variantId} line={line} cartLine={cartLine} /> : null;
        })}
      </ul>
      {/* Fixed at the bottom on mobile (docs/design.md), a side panel on desktop. */}
      <aside
        aria-label="Resumen"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 py-4 sm:px-6 lg:static lg:self-start lg:rounded-lg lg:border lg:p-6"
      >
        <div className="flex items-center justify-between">
          <span className="text-muted">Subtotal</span>
          <Price amountClp={quote.subtotalClp} className="text-xl font-semibold text-ink" />
        </div>
        <p className="mt-1 text-sm text-muted">El envío y los descuentos se calculan en el checkout.</p>
        {quote.canCheckout ? (
          <Link href="/checkout" className={buttonClassName("primary", "md", "mt-4 w-full")}>
            Continuar al pago
          </Link>
        ) : (
          <p className="mt-2 text-sm font-medium text-red-700 dark:text-red-400">Revisa los productos marcados para continuar.</p>
        )}
      </aside>
    </div>
  );
}
