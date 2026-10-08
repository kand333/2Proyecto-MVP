/**
 * Age notice (RF-04): remembers in this browser that the visitor declared being an adult. Only UX:
 * the API is what refuses minors (DEC-008). Storage may be blocked (private mode): then the answer
 * lasts until the page is reloaded.
 */

import { AGE_GATE_STORAGE_KEY } from "@portal/shared/app-config";

const CONFIRMED_VALUE = "1";

let confirmedInMemory = false;
const listeners = new Set<() => void>();

export function hasConfirmedAge(): boolean {
  if (confirmedInMemory) return true;
  try {
    return localStorage.getItem(AGE_GATE_STORAGE_KEY) === CONFIRMED_VALUE;
  } catch {
    return false;
  }
}

export function confirmAge(): void {
  confirmedInMemory = true;
  try {
    localStorage.setItem(AGE_GATE_STORAGE_KEY, CONFIRMED_VALUE);
  } catch {
    // Storage blocked: remembered only for this page.
  }
  listeners.forEach((listener) => listener());
}

/** For `useSyncExternalStore`: also follows the answer given in another tab. */
export function subscribeAgeGate(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === AGE_GATE_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Tests only. */
export function resetAgeGate(): void {
  confirmedInMemory = false;
  listeners.clear();
}
