import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  /** A Phosphor icon from `@phosphor-icons/react/ssr` (decorative). */
  icon: Icon;
  title: string;
  description?: string;
  /** What to do next, e.g. a link to clear the filters. */
  action?: ReactNode;
  className?: string;
};

/** An empty list or page that says why and how to fill it. */
export function EmptyState({ icon: IconComponent, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center border-t border-line px-4 py-16 text-center", className)}>
      <IconComponent aria-hidden="true" className="size-10 text-muted" />
      <h2 className="mt-4 font-display text-xl font-semibold tracking-tight text-ink">{title}</h2>
      {description && <p className="mt-2 max-w-prose text-pretty text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
