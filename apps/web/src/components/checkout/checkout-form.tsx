"use client";

import { ShoppingBag } from "@phosphor-icons/react";
import type { AuthUser } from "@portal/shared/auth";
import {
  CHILE_REGIONS,
  ORDER_BIRTH_DATE_REQUIRED,
  SHIPPING_METHOD_LABELS,
  SHIPPING_METHODS,
  orderCreateSchema,
  type ChileRegion,
  type Quote,
  type ShippingMethod,
} from "@portal/shared/order";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { Button, buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/field";
import { Price } from "@/components/ui/price";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ApiClientError } from "@/lib/api-client";
import { clearCart } from "@/lib/cart";
import { SETTINGS_KEY, fetchPublicSettings, fetchQuote, orderPath, placeOrder } from "@/lib/checkout";
import { cn } from "@/lib/cn";
import { OrderTotals } from "./order-totals";

type Errors = Record<string, string>;

const errorsOf = (issues: { path: PropertyKey[]; message: string }[]): Errors => {
  const errors: Errors = {};
  for (const issue of issues) errors[issue.path.map(String).join(".") || "form"] ??= issue.message;
  return errors;
};

const radioCardClassName =
  "flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent";

/**
 * Checkout (RF-08, docs/design.md): one column, label over each field, big radios for shipping, and the
 * server quote re-asked on every change of shipping, email or code. Confirming is the only primary action.
 */
function CheckoutFormFields({ user }: { user: AuthUser | null }) {
  const router = useRouter();
  const lines = useCart();
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("DELIVERY");
  const [email, setEmail] = useState(user?.email ?? "");
  const [quotedEmail, setQuotedEmail] = useState(user?.email ?? "");
  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  // A guest always gives a birth date; an account only if the API says it has none (RF-08).
  const [needsBirthDate, setNeedsBirthDate] = useState(!user);
  const [errors, setErrors] = useState<Errors>({});
  const [isPlacing, setIsPlacing] = useState(false);

  const { data: settings } = useSWR(SETTINGS_KEY, fetchPublicSettings);
  const { data: quote, error: quoteError, mutate: requote } = useSWR<Quote, Error>(
    lines.length > 0 ? ["checkout-quote", JSON.stringify(lines), shippingMethod, quotedEmail, appliedCode] : null,
    () => fetchQuote({ lines, shippingMethod, email: quotedEmail || undefined, discountCode: appliedCode || undefined }),
    { keepPreviousData: true },
  );

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Tu carrito está vacío"
        description="Añade productos antes de pagar."
        action={
          <Link href="/products" className={buttonClassName()}>
            Ver catálogo
          </Link>
        }
      />
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "");
    const parsed = orderCreateSchema.safeParse({
      lines,
      shippingMethod,
      email,
      name: text("name"),
      phone: text("phone"),
      birthDate: needsBirthDate ? text("birthDate") : undefined,
      discountCode: appliedCode || undefined,
      address:
        shippingMethod === "DELIVERY" ? { region: text("region"), commune: text("commune"), street: text("street"), extra: text("extra") } : undefined,
    });
    if (!parsed.success) {
      setErrors(errorsOf(parsed.error.issues));
      return;
    }
    if (needsBirthDate && !parsed.data.birthDate) {
      setErrors({ birthDate: ORDER_BIRTH_DATE_REQUIRED });
      return;
    }

    setErrors({});
    setIsPlacing(true);
    try {
      const created = await placeOrder(parsed.data);
      clearCart();
      router.push(orderPath(created.accessToken));
    } catch (error) {
      setIsPlacing(false);
      if (!(error instanceof ApiClientError)) {
        setErrors({ form: "No fue posible crear el pedido. Revisa tu conexión e inténtalo de nuevo." });
        return;
      }
      if (error.message === ORDER_BIRTH_DATE_REQUIRED) {
        setNeedsBirthDate(true);
        setErrors({ birthDate: error.message });
      } else if (error.status === 422) {
        setErrors({ birthDate: error.message });
      } else if (error.message.includes("código")) {
        setErrors({ discountCode: error.message });
      } else {
        setErrors({ form: error.message });
        if (error.status === 409) void requote();
      }
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mx-auto flex max-w-[40rem] flex-col gap-10">
      <section aria-labelledby="checkout-contact" className="flex flex-col gap-5">
        <h2 id="checkout-contact" className="font-display text-xl font-bold text-ink">
          Tus datos
        </h2>
        <Field id="checkout-email" label="Email" hint="Para identificar tu pedido y tu código de descuento." error={errors.email}>
          {(control) => (
            <Input
              {...control}
              type="email"
              name="email"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setQuotedEmail(email.trim().toLowerCase())}
            />
          )}
        </Field>
        <Field id="checkout-name" label="Nombre y apellido" error={errors.name}>
          {(control) => <Input {...control} name="name" autoComplete="name" defaultValue={user?.name} />}
        </Field>
        <Field id="checkout-phone" label="Teléfono" hint="Por ejemplo +56 9 1234 5678." error={errors.phone}>
          {(control) => <Input {...control} type="tel" name="phone" autoComplete="tel" inputMode="tel" />}
        </Field>
        {needsBirthDate && (
          <Field id="checkout-birth-date" label="Fecha de nacimiento" hint="Solo vendemos a mayores de 18 años." error={errors.birthDate}>
            {(control) => <Input {...control} type="date" name="birthDate" autoComplete="bday" />}
          </Field>
        )}
      </section>

      <section aria-labelledby="checkout-shipping" className="flex flex-col gap-5">
        <h2 id="checkout-shipping" className="font-display text-xl font-bold text-ink">
          Entrega
        </h2>
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">Método de entrega</legend>
          {SHIPPING_METHODS.map((method) => (
            <label key={method} className={cn(radioCardClassName, method === shippingMethod ? "border-ink bg-paper text-ink" : "border-line text-ink hover:border-ink")}>
              <input
                type="radio"
                name="shippingMethod"
                value={method}
                checked={method === shippingMethod}
                onChange={() => setShippingMethod(method)}
                className="size-4 accent-accent"
              />
              {SHIPPING_METHOD_LABELS[method]}
            </label>
          ))}
        </fieldset>
        {shippingMethod === "PICKUP" ? (
          <p className="text-sm text-muted">{settings?.pickupAddress ? `Retiras en: ${settings.pickupAddress}` : "Te enviaremos la dirección de retiro con tu pedido."}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="checkout-region" label="Región" error={errors["address.region"] ?? errors.address} className="sm:col-span-2">
              {(control) => (
                <Select {...control} name="region" autoComplete="address-level1" defaultValue="RM">
                  {(Object.keys(CHILE_REGIONS) as ChileRegion[]).map((code) => (
                    <option key={code} value={code}>
                      {CHILE_REGIONS[code]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field id="checkout-commune" label="Comuna" error={errors["address.commune"]}>
              {(control) => <Input {...control} name="commune" autoComplete="address-level2" />}
            </Field>
            <Field id="checkout-street" label="Calle y número" error={errors["address.street"]}>
              {(control) => <Input {...control} name="street" autoComplete="address-line1" />}
            </Field>
            <Field id="checkout-extra" label="Depto, casa u oficina" hint="Opcional." error={errors["address.extra"]} className="sm:col-span-2">
              {(control) => <Input {...control} name="extra" autoComplete="address-line2" />}
            </Field>
          </div>
        )}
      </section>

      <section aria-labelledby="checkout-summary" className="flex flex-col gap-5 rounded-lg border border-line bg-surface p-6">
        <h2 id="checkout-summary" className="font-display text-xl font-bold text-ink">
          Resumen
        </h2>
        {quote ? (
          <>
            <ul className="divide-y divide-line text-sm">
              {quote.lines.map((line) => (
                <li key={line.variantId} className="flex justify-between gap-4 py-2">
                  <span className="min-w-0 text-ink">
                    {line.productName} {line.variantName && <span className="text-muted">({line.variantName})</span>} x {line.quantity}
                    {line.issue && <span className="block text-red-700 dark:text-red-400">No disponible en esa cantidad: vuelve al carrito.</span>}
                  </span>
                  <Price amountClp={line.lineTotalClp} className="shrink-0 text-ink" />
                </li>
              ))}
            </ul>
            <div className="flex items-end gap-2">
              <Field id="checkout-code" label="Código de descuento" error={errors.discountCode ?? quote.discountError ?? undefined} className="flex-1">
                {(control) => (
                  <Input
                    {...control}
                    name="discountCode"
                    autoComplete="off"
                    spellCheck={false}
                    value={codeInput}
                    onChange={(event) => setCodeInput(event.target.value)}
                    placeholder="BIENVENIDA-…"
                  />
                )}
              </Field>
              <Button
                variant="secondary"
                className={errors.discountCode || quote.discountError ? "mb-7" : undefined}
                onClick={() => {
                  setQuotedEmail(email.trim().toLowerCase());
                  setAppliedCode(codeInput.trim().toUpperCase());
                }}
              >
                Aplicar
              </Button>
            </div>
            <OrderTotals {...quote} />
          </>
        ) : quoteError ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            No pudimos calcular el total. Recarga la página.
          </p>
        ) : (
          <Skeleton className="h-40" />
        )}
      </section>

      {errors.form && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {errors.form}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <Button type="submit" loading={isPlacing} loadingLabel="Confirmando…" disabled={!quote?.canCheckout} className="w-full">
          Confirmar pedido
        </Button>
        <p className="text-center text-sm text-muted">Pagas por transferencia: verás los datos al confirmar.</p>
      </div>
    </form>
  );
}

/** Waits for the session check, so an account's email and name come prefilled. */
export function CheckoutForm() {
  const { data: user, isLoading } = useCurrentUser();
  if (isLoading) return <Skeleton className="mx-auto h-96 max-w-[40rem]" />;
  return <CheckoutFormFields key={user?.id ?? "guest"} user={user ?? null} />;
}
