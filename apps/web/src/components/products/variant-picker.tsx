"use client";

import { ShoppingBag } from "@phosphor-icons/react";
import type { PublicProductVariant } from "@portal/shared/product";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { cn } from "@/lib/cn";

function stockLabel(variant: PublicProductVariant) {
  if (!variant.inStock) return "Agotado";
  return variant.lowStock ? "Últimas unidades" : "Disponible";
}

/**
 * Variant choice of the product page (RF-03): price (with the previous one if on offer), stock and
 * "Añadir al carrito", disabled when the chosen variant is sold out. Starts on the first one in stock.
 */
export function VariantPicker({ variants }: { variants: PublicProductVariant[] }) {
  const [selectedId, setSelectedId] = useState(() => (variants.find((variant) => variant.inStock) ?? variants[0])?.id);
  const selected = variants.find((variant) => variant.id === selectedId) ?? variants[0];
  if (!selected) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Price amountClp={selected.priceClp} compareAtClp={selected.compareAtPriceClp} className="text-2xl font-semibold text-ink" />
        {selected.inStock && selected.compareAtPriceClp !== null && <Badge tone="offer">Oferta</Badge>}
      </div>

      {variants.length > 1 && (
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-ink">Variante</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <label
                key={variant.id}
                className={cn(
                  "relative inline-flex min-h-11 cursor-pointer items-center rounded-sm border px-4 text-sm font-medium transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                  variant.id === selected.id ? "border-ink bg-ink text-paper" : "border-line text-ink hover:border-ink",
                  !variant.inStock && "text-muted line-through decoration-1",
                  !variant.inStock && variant.id === selected.id && "text-paper",
                )}
              >
                <input
                  type="radio"
                  name="variant"
                  value={variant.id}
                  checked={variant.id === selected.id}
                  onChange={() => setSelectedId(variant.id)}
                  className="sr-only"
                />
                {variant.name}
                {!variant.inStock && <span className="sr-only"> (agotado)</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <p aria-live="polite" className={cn("text-sm font-medium", selected.inStock ? "text-ink" : "text-red-700 dark:text-red-400")}>
        {stockLabel(selected)}
      </p>

      {/* The cart arrives with T014, which wires this button to it. */}
      <Button disabled={!selected.inStock} className="w-full sm:w-auto" iconEnd={<ShoppingBag />}>
        Añadir al carrito
      </Button>
    </div>
  );
}
