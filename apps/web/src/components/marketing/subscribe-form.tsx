"use client";

import { ArrowRight, Check, Copy } from "@phosphor-icons/react";
import { subscribeSchema, WELCOME_DISCOUNT_PERCENT } from "@portal/shared/subscriber";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { ApiClientError } from "@/lib/api-client";
import { subscribe } from "@/lib/subscribers";

type Errors = { email?: string; marketingConsent?: string; form?: string };

/** The code once subscribed, with a copy button (RF-12). */
export function WelcomeCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink">Tu código de {WELCOME_DISCOUNT_PERCENT} % para el primer pedido:</p>
      <div className="flex items-center gap-2">
        <code className="rounded-sm border border-line bg-paper px-3 py-2 font-semibold tracking-wide text-ink">{code}</code>
        <Button
          variant="secondary"
          size="sm"
          iconEnd={copied ? <Check /> : <Copy />}
          onClick={async () => {
            await navigator.clipboard?.writeText(code).catch(() => undefined);
            setCopied(true);
          }}
        >
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <p aria-live="polite" className="text-sm text-muted">
        Úsalo en el checkout con este mismo email.
      </p>
    </div>
  );
}

type SubscribeFormProps = {
  /** `box` in the popup; `underline` in the footer (docs/design.md). */
  variant?: "box" | "underline";
  /** Called with the code once subscribed (the popup remembers it was used). */
  onSubscribed?: (code: string) => void;
};

/** Email and mandatory marketing consent, validated with the shared schema before sending (RF-12, RF-26). */
export function SubscribeForm({ variant = "box", onSubscribed }: SubscribeFormProps) {
  const idPrefix = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [code, setCode] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = subscribeSchema.safeParse({ email: String(form.get("email") ?? ""), marketingConsent: form.get("marketingConsent") === "on" });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] === "email" ? "email" : "marketingConsent";
        next[field] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setIsSending(true);
    try {
      const result = await subscribe(parsed.data.email);
      setCode(result.code);
      onSubscribed?.(result.code);
    } catch (error) {
      setErrors({ form: error instanceof ApiClientError ? error.message : "No fue posible suscribirte. Inténtalo de nuevo." });
    } finally {
      setIsSending(false);
    }
  }

  if (code) return <WelcomeCode code={code} />;

  const consentId = `${idPrefix}-consent`;
  const consentErrorId = `${consentId}-error`;
  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      {variant === "underline" ? (
        <Field id={`${idPrefix}-email`} label="Email" error={errors.email}>
          {(control) => (
            <div className="flex items-end gap-2">
              <Input {...control} variant="underline" type="email" name="email" autoComplete="email" spellCheck={false} />
              <IconButton type="submit" label="Suscribirme" icon={<ArrowRight />} disabled={isSending} />
            </div>
          )}
        </Field>
      ) : (
        <Field id={`${idPrefix}-email`} label="Email" error={errors.email}>
          {(control) => <Input {...control} type="email" name="email" autoComplete="email" spellCheck={false} />}
        </Field>
      )}
      <div>
        <label htmlFor={consentId} className="flex items-start gap-3 text-sm text-ink">
          <input
            id={consentId}
            type="checkbox"
            name="marketingConsent"
            aria-invalid={errors.marketingConsent ? true : undefined}
            aria-describedby={errors.marketingConsent ? consentErrorId : undefined}
            className="mt-0.5 size-4 shrink-0 accent-accent"
          />
          Acepto recibir novedades y promociones de Terpenex por email.
        </label>
        {errors.marketingConsent && (
          <p id={consentErrorId} className="mt-1 text-sm text-red-700 dark:text-red-400">
            {errors.marketingConsent}
          </p>
        )}
      </div>
      {errors.form && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {errors.form}
        </p>
      )}
      {variant === "box" && (
        <Button type="submit" loading={isSending} loadingLabel="Enviando…">
          Quiero mi código
        </Button>
      )}
    </form>
  );
}
