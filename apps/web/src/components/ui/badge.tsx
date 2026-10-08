import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "accent" | "success" | "danger";

const toneClassNames: Record<BadgeTone, string> = {
  neutral: "border-line bg-paper text-muted",
  accent: "border-accent/40 bg-accent/10 text-accent",
  success: "border-emerald-600/40 bg-emerald-600/10 text-emerald-800 dark:border-emerald-400/40 dark:text-emerald-300",
  danger: "border-red-600/40 bg-red-600/10 text-red-800 dark:border-red-400/40 dark:text-red-300",
};

/** Short status label ("Agotado", "Pagado"). The only pill shape of the site (docs/design.md). */
export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        toneClassNames[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
