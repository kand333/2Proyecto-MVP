"use client";

import { ShoppingBag } from "@phosphor-icons/react";
import Link from "next/link";
import { IconCount, iconButtonClassName } from "@/components/ui/icon-button";
import { useCart } from "@/hooks/use-cart";
import { countUnits } from "@/lib/cart";

/** Cart icon of the header with the number of units (RF-06); the label says the number for screen readers. */
export function HeaderCartLink() {
  const units = countUnits(useCart());
  return (
    <Link href="/cart" aria-label={units > 0 ? `Carrito, ${units} ${units === 1 ? "unidad" : "unidades"}` : "Carrito"} className={iconButtonClassName()}>
      <ShoppingBag aria-hidden="true" />
      {units > 0 && <IconCount count={units} />}
    </Link>
  );
}
