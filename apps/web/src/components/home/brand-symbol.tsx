import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * The logo symbol cropped to a circle: the PNG has an opaque white background (DEC-015), so its own
 * white becomes a disc that looks intended on any surface and in dark mode. Decorative.
 */
export function BrandSymbol({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <div className={cn("relative aspect-square overflow-hidden rounded-full shadow-soft", className)}>
      <Image src="/brand/terpenex-symbol.png" alt="" fill sizes="(min-width: 1024px) 320px, 45vw" priority={priority} className="object-cover" />
    </div>
  );
}

/** Slot of a home image while its file is missing: brand panel with the final aspect ratio (no layout shift). */
export function BrandPanel({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center bg-accent", className)}>
      <BrandSymbol className="w-2/5 max-w-72" />
    </div>
  );
}
