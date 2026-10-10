import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Classes of a 44 × 44 icon control, for links that look like one (`<Link className={iconButtonClassName()}>`).
 * Focus uses the global `:focus-visible` outline.
 */
export function iconButtonClassName(className?: string) {
  return cn(
    "relative inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-ink transition-[background-color,color,transform] duration-200 hover:bg-paper hover:text-accent active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 [&>svg]:size-[22px]",
    className,
  );
}

/** Small count over the icon (cart units). Decorative: the control's label must say the number. */
export function IconCount({ count }: { count: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute right-0.5 top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold tabular-nums leading-5 text-on-accent"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> & {
  /** Accessible name, required: the button only shows an icon. */
  label: string;
  /** A decorative Phosphor icon. */
  icon: ReactNode;
};

/** Button with only an icon (header search, carousel arrows). `type` defaults to "button". */
export function IconButton({ label, icon, className, type = "button", ...props }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} className={iconButtonClassName(className)} {...props}>
      <span aria-hidden="true" className="inline-flex [&>svg]:size-[22px]">
        {icon}
      </span>
    </button>
  );
}
