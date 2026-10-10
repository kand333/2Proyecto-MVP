import { CircleNotch } from "@phosphor-icons/react/ssr";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

const variantClassNames: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "border border-ink text-ink hover:bg-ink hover:text-paper",
  ghost: "text-ink hover:bg-surface hover:text-accent",
  // on-accent is light in light mode and dark in dark mode: AA on red-700 and on red-400.
  danger: "bg-red-700 text-on-accent hover:bg-red-800 dark:bg-red-400 dark:hover:bg-red-300",
};

const sizeClassNames: Record<ButtonSize, string> = {
  md: "h-11 px-5 text-sm",
  sm: "h-9 px-3.5 text-sm",
};

/**
 * Classes of a button, for links that look like one (`<Link className={buttonClassName()}>`).
 * Radius 4 px (docs/design.md); focus uses the global `:focus-visible` outline.
 */
export function buttonClassName(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
    variantClassNames[variant],
    sizeClassNames[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Disables the button and shows a spinner while a request runs. */
  loading?: boolean;
  /** Label while loading, ending in "…" (e.g. "Guardando…"). Defaults to the normal label. */
  loadingLabel?: string;
  /** Decorative icon after the label, e.g. `<ArrowRight />` (never a typed arrow character). */
  iconEnd?: ReactNode;
};

/** Site button. `type` defaults to "button" so it never submits a form by accident. */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel,
  iconEnd,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClassName(variant, size, className)}
      {...props}
    >
      {loading && <CircleNotch aria-hidden="true" className="size-4 animate-spin" />}
      {loading && loadingLabel ? loadingLabel : children}
      {!loading && iconEnd && (
        <span aria-hidden="true" className="inline-flex [&>svg]:size-4">
          {iconEnd}
        </span>
      )}
    </button>
  );
}
