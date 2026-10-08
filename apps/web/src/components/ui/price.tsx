import { formatClp } from "@portal/shared/product";
import { cn } from "@/lib/cn";

type PriceProps = {
  /** Whole Chilean pesos (DEC-003). */
  amountClp: number;
  /** Prefixes "Desde" for the lowest price of several variants. */
  from?: boolean;
  className?: string;
};

/** A CLP price with tabular figures: `$12.990`. */
export function Price({ amountClp, from = false, className }: PriceProps) {
  return (
    <span className={cn("tabular-nums", className)}>
      {from && <span className="font-normal text-muted">Desde </span>}
      <data value={amountClp}>{formatClp(amountClp)}</data>
    </span>
  );
}
