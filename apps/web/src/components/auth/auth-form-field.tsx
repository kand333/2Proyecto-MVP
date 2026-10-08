import type { InputHTMLAttributes } from "react";

type AuthFormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error: string | undefined;
};

/** Labelled input with its inline error, shared by the login and registration forms. */
export function AuthFormField({ id, label, error, ...inputProps }: AuthFormFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-ink transition-colors duration-200 hover:border-accent/60 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 aria-invalid:border-red-600"
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
