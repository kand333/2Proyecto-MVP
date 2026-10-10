import { CaretDown } from "@phosphor-icons/react/ssr";
import type { InputHTMLAttributes, ReactNode, Ref, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Accessibility props that tie a control to its label, help and error. */
export type FieldControlProps = {
  id: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
};

type FieldProps = {
  id: string;
  label: string;
  /** Optional help under the label, e.g. the format expected. */
  hint?: string;
  /** Shown under the control and announced with it. */
  error?: string;
  className?: string;
  /** Renders the control with the props that connect it to the label, help and error. */
  children: (control: FieldControlProps) => ReactNode;
};

/**
 * Label above, help, control and error below (docs/design.md, checkout). Works with `Input`,
 * `Select`, `Textarea` or any control that accepts the given props.
 */
export function Field({ id, label, hint, error, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {error && (
        <p id={errorId} className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

// Explicit background and text color: native controls follow them in every OS theme.
const controlClassName =
  "w-full rounded-sm border border-line bg-surface px-3.5 text-base text-ink transition-colors duration-200 hover:border-accent/60 focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-600 dark:aria-invalid:border-red-400";

// Footer subscription only (docs/design.md): no box, a single ink rule under the text.
const underlineClassName =
  "w-full border-0 border-b border-ink bg-transparent px-0 text-base text-ink transition-colors duration-200 focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-600 dark:aria-invalid:border-red-400";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { variant?: "box" | "underline"; ref?: Ref<HTMLInputElement> };

export function Input({ variant = "box", className, ...props }: InputProps) {
  return <input className={cn(variant === "box" ? controlClassName : underlineClassName, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClassName, "min-h-28 py-2.5 leading-relaxed", className)} {...props} />;
}

/** Native select (keyboard and screen readers for free) with the site's look and a Phosphor caret. */
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(controlClassName, "h-11 appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <CaretDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
