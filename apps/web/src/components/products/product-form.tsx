"use client";

import { Plus, Trash } from "@phosphor-icons/react";
import {
  MAX_PRODUCT_VARIANTS,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  PRODUCT_NAME_MAX_LENGTH,
  PRODUCT_SLUG_MAX_LENGTH,
  VARIANT_NAME_MAX_LENGTH,
  VARIANT_SKU_MAX_LENGTH,
  productCreateSchema,
  type Product,
} from "@portal/shared/product";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { ApiClientError } from "@/lib/api-client";
import { flash } from "@/lib/flash";
import { ADMIN_PRODUCTS_PATH, createProduct, slugify, updateProduct } from "@/lib/products";

/** One editable variant row. Numbers stay as typed text until submit. */
type VariantRow = {
  key: number;
  name: string;
  sku: string;
  priceClp: string;
  compareAtPriceClp: string;
  stock: string;
  isActive: boolean;
  /** Already stored: its SKU is the match key on save, so it cannot change. */
  saved: boolean;
};

/** Errors by field path: "name", "slug", "variants.1.sku"… */
export type ProductFieldErrors = Record<string, string>;

export function fieldErrorsOf(issues: { path: PropertyKey[]; message: string }[]): ProductFieldErrors {
  const errors: ProductFieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".") || "form";
    errors[key] ??= issue.message;
  }
  return errors;
}

/** Puts a 409 next to its field: the slug, or the variant whose SKU repeats (RF-01). */
export function conflictErrorsOf(message: string, skus: string[]): ProductFieldErrors {
  if (message.includes("slug")) return { slug: message };
  const sku = /SKU (\S+)/.exec(message)?.[1];
  const index = sku ? skus.findIndex((value) => value.trim().toUpperCase() === sku) : -1;
  return index >= 0 ? { [`variants.${index}.sku`]: message } : { form: message };
}

/** Empty text is "not entered" (the schema asks for it); anything else becomes a number to validate. */
const numberOrUndefined = (text: string) => (text.trim() === "" ? undefined : Number(text));

const toRow = (key: number, variant?: Product["variants"][number]): VariantRow => ({
  key,
  name: variant?.name ?? "",
  sku: variant?.sku ?? "",
  priceClp: variant ? String(variant.priceClp) : "",
  compareAtPriceClp: variant?.compareAtPriceClp ? String(variant.compareAtPriceClp) : "",
  stock: variant ? String(variant.stock) : "0",
  isActive: variant?.isActive ?? true,
  saved: Boolean(variant),
});

/**
 * Creates a product, or edits `product` when given (RF-01, RF-27). Variants are matched by SKU on
 * save; removing a row deactivates that variant (it is never deleted). Validates with the shared schema.
 */
export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const nextKey = useRef(product?.variants.length ?? 1);
  const [rows, setRows] = useState<VariantRow[]>(() =>
    product ? product.variants.map((variant, index) => toRow(index, variant)) : [toRow(0)],
  );
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const [errors, setErrors] = useState<ProductFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateRow = (key: number, change: Partial<VariantRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)));

  function addRow() {
    setRows((current) => [...current, toRow(nextKey.current)]);
    nextKey.current += 1;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = productCreateSchema.safeParse({
      name,
      slug,
      description: String(form.get("description") ?? ""),
      category: String(form.get("category") ?? ""),
      isPublished: form.get("isPublished") === "on",
      isFeatured: form.get("isFeatured") === "on",
      variants: rows.map((row) => ({
        name: row.name,
        sku: row.sku,
        priceClp: numberOrUndefined(row.priceClp),
        compareAtPriceClp: numberOrUndefined(row.compareAtPriceClp) ?? null,
        stock: numberOrUndefined(row.stock),
        isActive: row.isActive,
      })),
    });
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error.issues));
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      if (product) await updateProduct(product.id, parsed.data);
      else await createProduct(parsed.data);
      flash(product ? "Producto guardado." : "Producto creado.");
      router.push(ADMIN_PRODUCTS_PATH);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        setErrors(conflictErrorsOf(error.message, rows.map((row) => row.sku)));
      } else {
        setErrors({ form: error instanceof ApiClientError ? error.message : "No fue posible guardar el producto. Inténtalo de nuevo." });
      }
      setIsSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-8">
      <section aria-labelledby="product-data-title" className="space-y-5 rounded-lg border border-line bg-surface p-6">
        <h2 id="product-data-title" className="font-display text-xl font-bold text-ink">
          Datos del producto
        </h2>
        <Field id="product-name" label="Nombre" error={errors.name}>
          {(control) => (
            <Input
              {...control}
              name="name"
              value={name}
              maxLength={PRODUCT_NAME_MAX_LENGTH}
              autoComplete="off"
              onChange={(event) => {
                setName(event.target.value);
                if (!slugEdited) setSlug(slugify(event.target.value));
              }}
            />
          )}
        </Field>
        <Field id="product-slug" label="Slug" hint="Dirección de la ficha: /products/slug. Solo minúsculas, números y guiones." error={errors.slug}>
          {(control) => (
            <Input
              {...control}
              name="slug"
              value={slug}
              maxLength={PRODUCT_SLUG_MAX_LENGTH}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                setSlug(event.target.value);
                setSlugEdited(true);
              }}
            />
          )}
        </Field>
        <Field id="product-category" label="Categoría" error={errors.category}>
          {(control) => (
            <Select {...control} name="category" defaultValue={product?.category ?? PRODUCT_CATEGORIES[0]}>
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {PRODUCT_CATEGORY_LABELS[category]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="product-description" label="Descripción" error={errors.description}>
          {(control) => (
            <Textarea {...control} name="description" rows={5} defaultValue={product?.description} maxLength={PRODUCT_DESCRIPTION_MAX_LENGTH} />
          )}
        </Field>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <label className="flex items-center gap-3 text-sm font-medium text-ink">
            <input type="checkbox" name="isPublished" defaultChecked={product?.isPublished} className="size-4 accent-accent" />
            Publicado (visible en el catálogo)
          </label>
          <label className="flex items-center gap-3 text-sm font-medium text-ink">
            <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured} className="size-4 accent-accent" />
            Destacado en portada
          </label>
        </div>
      </section>

      <section aria-labelledby="product-variants-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="product-variants-title" className="font-display text-xl font-bold text-ink">
              Variantes
            </h2>
            <p className="text-sm text-muted">Entre 1 y {MAX_PRODUCT_VARIANTS}. Quitar una variante guardada la desactiva.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={addRow} disabled={rows.length >= MAX_PRODUCT_VARIANTS} iconEnd={<Plus />}>
            Agregar variante
          </Button>
        </div>
        {errors.variants && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            {errors.variants}
          </p>
        )}
        <ol className="space-y-4">
          {rows.map((row, index) => {
            const error = (field: string) => errors[`variants.${index}.${field}`];
            const id = (field: string) => `variant-${row.key}-${field}`;
            return (
              <li key={row.key} className="rounded-lg border border-line bg-surface p-5">
                <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <legend className="mb-3 text-sm font-semibold text-ink">Variante {index + 1}</legend>
                  <Field id={id("name")} label="Nombre" error={error("name")}>
                    {(control) => (
                      <Input {...control} value={row.name} maxLength={VARIANT_NAME_MAX_LENGTH} autoComplete="off" onChange={(event) => updateRow(row.key, { name: event.target.value })} />
                    )}
                  </Field>
                  <Field id={id("sku")} label="SKU" error={error("sku")}>
                    {(control) => (
                      <Input
                        {...control}
                        value={row.sku}
                        maxLength={VARIANT_SKU_MAX_LENGTH}
                        autoComplete="off"
                        spellCheck={false}
                        readOnly={row.saved}
                        onChange={(event) => updateRow(row.key, { sku: event.target.value })}
                      />
                    )}
                  </Field>
                  <Field id={id("stock")} label="Stock" error={error("stock")}>
                    {(control) => (
                      <Input {...control} inputMode="numeric" value={row.stock} onChange={(event) => updateRow(row.key, { stock: event.target.value })} />
                    )}
                  </Field>
                  <Field id={id("priceClp")} label="Precio (CLP)" error={error("priceClp")}>
                    {(control) => (
                      <Input {...control} inputMode="numeric" value={row.priceClp} onChange={(event) => updateRow(row.key, { priceClp: event.target.value })} />
                    )}
                  </Field>
                  <Field id={id("compareAtPriceClp")} label="Precio anterior (CLP)" hint="Opcional. Debe ser un precio real cobrado antes." error={error("compareAtPriceClp")}>
                    {(control) => (
                      <Input
                        {...control}
                        inputMode="numeric"
                        value={row.compareAtPriceClp}
                        onChange={(event) => updateRow(row.key, { compareAtPriceClp: event.target.value })}
                      />
                    )}
                  </Field>
                  <div className="flex items-end justify-between gap-3">
                    <label className="flex h-11 items-center gap-3 text-sm font-medium text-ink">
                      <input
                        type="checkbox"
                        checked={row.isActive}
                        onChange={(event) => updateRow(row.key, { isActive: event.target.checked })}
                        className="size-4 accent-accent"
                      />
                      Activa
                    </label>
                    <IconButton
                      label={`Quitar variante ${index + 1}`}
                      icon={<Trash />}
                      disabled={rows.length === 1}
                      onClick={() => setRows((current) => current.filter((candidate) => candidate.key !== row.key))}
                    />
                  </div>
                </fieldset>
              </li>
            );
          })}
        </ol>
      </section>

      {errors.form && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {errors.form}
        </p>
      )}
      <Button type="submit" loading={isSubmitting} loadingLabel="Guardando…">
        {product ? "Guardar cambios" : "Crear producto"}
      </Button>
    </form>
  );
}
