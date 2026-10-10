"use client";

import { ITEM_DESCRIPTION_MAX_LENGTH, ITEM_TITLE_MAX_LENGTH, itemCreateSchema, type Item } from "@portal/shared/item";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { ApiClientError } from "@/lib/api-client";
import { flash } from "@/lib/flash";
import { ADMIN_ITEMS_PATH, createItem, updateItem } from "@/lib/items";

type FieldErrors = Partial<Record<"title" | "description", string>>;

const fieldErrorsOf = (issues: { path: PropertyKey[]; message: string }[]): FieldErrors => {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if ((field === "title" || field === "description") && !errors[field]) errors[field] = issue.message;
  }
  return errors;
};

/** Creates an item, or edits `item` when given. Validates with the shared schema before sending. */
export function ItemForm({ item }: { item?: Item }) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = itemCreateSchema.safeParse({
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      isPublished: form.get("isPublished") === "on",
    });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsOf(parsed.error.issues));
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);
    try {
      if (item) await updateItem(item.id, parsed.data);
      else await createItem(parsed.data);
      flash(item ? "Item guardado." : "Item creado.");
      router.push(ADMIN_ITEMS_PATH);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : "No fue posible guardar el item. Inténtalo de nuevo.");
      setIsSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5 rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft">
      <AuthFormField
        id="item-title"
        name="title"
        label="Título"
        defaultValue={item?.title}
        maxLength={ITEM_TITLE_MAX_LENGTH}
        required
        error={fieldErrors.title}
      />
      <div>
        <label htmlFor="item-description" className="mb-1.5 block text-sm font-medium text-ink">
          Descripción
        </label>
        <textarea
          id="item-description"
          name="description"
          rows={6}
          defaultValue={item?.description}
          maxLength={ITEM_DESCRIPTION_MAX_LENGTH}
          aria-invalid={fieldErrors.description ? true : undefined}
          aria-describedby={fieldErrors.description ? "item-description-error" : undefined}
          className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-ink transition-colors duration-200 hover:border-accent/60 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 aria-invalid:border-red-600"
        />
        {fieldErrors.description && (
          <p id="item-description-error" className="mt-1 text-sm text-red-700 dark:text-red-400">
            {fieldErrors.description}
          </p>
        )}
      </div>
      <label className="flex items-center gap-3 text-sm font-medium text-ink">
        <input type="checkbox" name="isPublished" defaultChecked={item?.isPublished} className="size-4 accent-accent" />
        Publicado (visible en el sitio)
      </label>

      {formError && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {formError}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 rounded-sm bg-accent px-6 font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover disabled:opacity-60"
      >
        {isSubmitting ? "Guardando…" : item ? "Guardar cambios" : "Crear item"}
      </button>
    </form>
  );
}
