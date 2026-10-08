import { cn } from "@/lib/cn";

/**
 * Placeholder with the shape of the content that is loading. Hidden from screen readers: the
 * region that loads announces it (e.g. `aria-busy` on the list).
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-line/70", className)} />;
}
