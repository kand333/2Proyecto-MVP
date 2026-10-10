import { formatClp } from "@portal/shared/product";
import { cn } from "@/lib/cn";

type PriceProps = {
  /** Whole Chilean pesos (DEC-003). */
  amountClp: number;
  /** Prefixes "Desde" for the lowest price of several variants. */
  from?: boolean;
  /** Previous price of an offer, shown struck through after the price (RF-27). */
  compareAtClp?: number | null;
  className?: string;
};

/** A CLP price with tabular figures: `$12.990`. */
export function Price({ amountClp, from = false, compareAtClp, className }: PriceProps) {
  return (
    <span className={cn("tabular-nums", className)}>
      {from && <span className="font-normal text-muted">Desde </span>}
      <data value={amountClp}>{formatClp(amountClp)}</data>
      {compareAtClp != null && (
        <s className="ml-2 font-normal text-muted">
          <span className="sr-only">Precio anterior </span>
          {formatClp(compareAtClp)}
        </s>
      )}
    </span>
  );
}
