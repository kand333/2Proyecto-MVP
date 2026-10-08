import type { ReactNode } from "react";

type AuthPageLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

/** Centered card of the login and registration pages. */
export function AuthPageLayout({ title, description, children }: AuthPageLayoutProps) {
  return (
    <section aria-labelledby="auth-title" className="mx-auto w-full max-w-md px-4 py-16 sm:py-24">
      <h1 id="auth-title" className="font-display text-5xl font-semibold tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-3 text-muted">{description}</p>
      <div className="mt-8 rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft sm:p-8">{children}</div>
    </section>
  );
}
