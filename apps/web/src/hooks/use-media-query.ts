"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether a CSS media query matches, kept up to date when the viewport changes.
 * On the server it reports `false` (no viewport there).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onChange);
      return () => mediaQueryList.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
