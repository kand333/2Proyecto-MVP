"use client";

import { useSyncExternalStore } from "react";
import { readCart, readServerCart, subscribeCart } from "@/lib/cart";

/** Lines of the browser cart, kept in sync with every change (also from other tabs). */
export function useCart() {
  return useSyncExternalStore(subscribeCart, readCart, readServerCart);
}
