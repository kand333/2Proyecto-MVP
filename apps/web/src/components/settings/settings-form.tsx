"use client";

import { PICKUP_ADDRESS_MAX_LENGTH, TRANSFER_INSTRUCTIONS_MAX_LENGTH, shopSettingsSchema, type ShopSettings } from "@portal/shared/settings";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ApiClientError } from "@/lib/api-client";
import { flash } from "@/lib/flash";
import { parseAmount, saveSettings } from "@/lib/settings";

type SettingsField = keyof ShopSettings;
type FieldErrors = Partial<Record<SettingsField | "form", string>>;

/** Shop settings of RF-10: delivery fee, free delivery threshold, pickup address and transfer details. */
export function SettingsForm({ settings }: { settings: ShopSettings }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = shopSettingsSchema.safeParse({
      flatShippingClp: parseAmount(String(form.get("flatShippingClp") ?? "")),
      freeShippingFromClp: parseAmount(String(form.get("freeShippingFromClp") ?? "")) ?? null,
      pickupAddress: String(form.get("pickupAddress") ?? ""),
      transferInstructions: String(form.get("transferInstructions") ?? ""),
    });
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = (issue.path[0] as SettingsField | undefined) ?? "form";
        fieldErrors[field] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      await saveSettings(parsed.data);
      flash("Ajustes guardados.");
      router.refresh();
    } catch (error) {
      setErrors({ form: error instanceof ApiClientError ? error.message : "No fue posible guardar los ajustes. Inténtalo de nuevo." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-line bg-surface p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="settings-flat-shipping" label="Costo de despacho (CLP)" hint="Tarifa fija para todo Chile." error={errors.flatShippingClp}>
          {(control) => <Input {...control} name="flatShippingClp" inputMode="numeric" autoComplete="off" defaultValue={String(settings.flatShippingClp)} />}
        </Field>
        <Field
          id="settings-free-shipping"
          label="Envío gratis desde (CLP)"
          hint="Subtotal desde el que el despacho es gratis. Vacío: nunca gratis."
          error={errors.freeShippingFromClp}
        >
          {(control) => (
            <Input
              {...control}
              name="freeShippingFromClp"
              inputMode="numeric"
              autoComplete="off"
              defaultValue={settings.freeShippingFromClp === null ? "" : String(settings.freeShippingFromClp)}
            />
          )}
        </Field>
      </div>
      <Field id="settings-pickup-address" label="Dirección de retiro" hint="Se muestra al elegir retiro en tienda." error={errors.pickupAddress}>
        {(control) => (
          <Input {...control} name="pickupAddress" autoComplete="off" maxLength={PICKUP_ADDRESS_MAX_LENGTH} defaultValue={settings.pickupAddress} />
        )}
      </Field>
      <Field
        id="settings-transfer"
        label="Instrucciones de transferencia"
        hint="Banco, tipo y número de cuenta, RUT y email. El cliente las ve solo en su pedido."
        error={errors.transferInstructions}
      >
        {(control) => (
          <Textarea {...control} name="transferInstructions" rows={6} maxLength={TRANSFER_INSTRUCTIONS_MAX_LENGTH} defaultValue={settings.transferInstructions} />
        )}
      </Field>

      {errors.form && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {errors.form}
        </p>
      )}
      <Button type="submit" loading={isSaving} loadingLabel="Guardando…">
        Guardar ajustes
      </Button>
    </form>
  );
}
