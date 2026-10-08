"use client";

// Public Item layer. Removable as a whole (see CLAUDE.md).

type ItemsErrorProps = {
  error: Error & { digest?: string };
  /** Re-fetches and re-renders the page (Next.js 16.2+). */
  retry: () => void;
};

export default function ItemsError({ retry }: ItemsErrorProps) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-5 px-4 py-24 sm:px-6">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">No pudimos cargar los items</h1>
      <p role="alert" className="text-lg text-muted">
        El servicio no respondió. Vuelve a intentarlo en unos segundos.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="inline-flex h-12 items-center rounded-full bg-accent px-7 font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover"
      >
        Reintentar
      </button>
    </section>
  );
}
