import { WarningCircle } from "@phosphor-icons/react/ssr";
import type { ProductCategory } from "@portal/shared/product";

/** Categories whose products contain nicotine (DEC-005, RF-03). */
export const NICOTINE_CATEGORIES: readonly ProductCategory[] = ["VAPES", "E_LIQUIDS"];

/** Visible health warning with AA contrast, never as faint grey text (docs/design.md). Draft pending legal review. */
export function HealthWarning() {
  return (
    <aside aria-label="Advertencia sanitaria" className="flex gap-3 rounded-lg border-2 border-ink p-4 text-sm text-ink">
      <WarningCircle aria-hidden="true" className="size-6 shrink-0" />
      <p>
        <strong className="font-semibold">Advertencia:</strong> este producto contiene nicotina, una sustancia altamente adictiva. Venta exclusiva a
        mayores de 18 años.
      </p>
    </aside>
  );
}
