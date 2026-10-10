/**
 * Browser cart (RF-06, DEC-002): only variant ids and quantities; prices, stock and totals always come
 * from the server quote (RF-07). Storage may be blocked (private mode) or hold anything: reads never
 * throw, invalid entries are dropped, and the cart then lives in memory until the page is reloaded.
 */

import { CART_STORAGE_KEY } from "@portal/shared/app-config";
import { MAX_CART_LINES, MAX_LINE_QUANTITY, MIN_LINE_QUANTITY, type CartLine } from "@portal/shared/order";

const EMPTY: readonly CartLine[] = Object.freeze([]);

let memoryCart: readonly CartLine[] | null = null;
let snapshot: { raw: string | null; lines: readonly CartLine[] } = { raw: null, lines: EMPTY };
const listeners = new Set<() => void>();

/** Variant ids are UUIDs: anything else would make the quote answer 400. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const clampQuantity = (quantity: number) => Math.min(MAX_LINE_QUANTITY, Math.max(MIN_LINE_QUANTITY, Math.trunc(quantity)));

/** Keeps only well-formed lines, one per variant, with quantities in 1-10. */
export function sanitizeCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const lines: CartLine[] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue;
    const { variantId, quantity } = entry as Record<string, unknown>;
    if (typeof variantId !== "string" || !UUID_PATTERN.test(variantId) || typeof quantity !== "number" || !Number.isFinite(quantity)) continue;
    if (lines.some((line) => line.variantId === variantId)) continue;
    lines.push({ variantId, quantity: clampQuantity(quantity) });
  }
  return lines.slice(0, MAX_CART_LINES);
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(CART_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Current lines. Stable reference while nothing changes (for `useSyncExternalStore`). */
export function readCart(): readonly CartLine[] {
  if (memoryCart) return memoryCart;
  const raw = readRaw();
  if (raw === snapshot.raw) return snapshot.lines;
  let lines: readonly CartLine[] = EMPTY;
  try {
    lines = raw ? sanitizeCart(JSON.parse(raw)) : EMPTY;
  } catch {
    lines = EMPTY;
  }
  snapshot = { raw, lines };
  return lines;
}

function writeCart(lines: readonly CartLine[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    memoryCart = null;
  } catch {
    // Storage blocked or full: keep the cart for this page only.
    memoryCart = lines;
  }
  listeners.forEach((listener) => listener());
}

/** Adds units of a variant (summing with what is already there, up to 10). */
export function addToCart(variantId: string, quantity = 1): void {
  const lines = readCart();
  const existing = lines.find((line) => line.variantId === variantId);
  if (!existing && lines.length >= MAX_CART_LINES) return;
  writeCart(
    existing
      ? lines.map((line) => (line.variantId === variantId ? { ...line, quantity: clampQuantity(line.quantity + quantity) } : line))
      : [...lines, { variantId, quantity: clampQuantity(quantity) }],
  );
}

export function setCartQuantity(variantId: string, quantity: number): void {
  writeCart(readCart().map((line) => (line.variantId === variantId ? { ...line, quantity: clampQuantity(quantity) } : line)));
}

export function removeFromCart(variantId: string): void {
  writeCart(readCart().filter((line) => line.variantId !== variantId));
}

/** Empties the cart (after an order, T019). */
export function clearCart(): void {
  writeCart(EMPTY);
}

/** Units in the cart, for the header count. */
export const countUnits = (lines: readonly CartLine[]) => lines.reduce((sum, line) => sum + line.quantity, 0);

/** For `useSyncExternalStore`: also follows changes made in another tab. */
export function subscribeCart(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === CART_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The server render has no cart: the count appears after hydration. */
export const readServerCart = (): readonly CartLine[] => EMPTY;

/** Tests only. */
export function resetCart(): void {
  memoryCart = null;
  snapshot = { raw: null, lines: EMPTY };
  listeners.clear();
}
