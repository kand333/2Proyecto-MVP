import Link from "next/link";

/** Shown to a logged-in user who opens a page reserved for another role. */
export function AccessDenied() {
  return (
    <section aria-labelledby="access-denied-title" className="mx-auto flex w-full max-w-3xl flex-col items-start gap-5 px-4 py-24 sm:px-6">
      <h1 id="access-denied-title" className="font-display text-5xl font-semibold tracking-tight text-ink">
        Acceso restringido
      </h1>
      <p className="text-lg text-muted">Esta sección es solo para administradores del sitio.</p>
      <Link
        href="/"
        className="inline-flex h-12 items-center rounded-full bg-accent px-7 font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
