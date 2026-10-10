"use client";

import { Button } from "@/components/ui/button";

type CatalogErrorProps = {
  error: Error & { digest?: string };
  /** Re-fetches and re-renders the page (Next.js 16.2+). */
  retry: () => void;
};

export default function CatalogError({ retry }: CatalogErrorProps) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-5 px-4 py-24 sm:px-6">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-ink font-stretch-condensed">No pudimos cargar el catálogo</h1>
      <p role="alert" className="text-lg text-muted">
        El servicio no respondió. Vuelve a intentarlo en unos segundos.
      </p>
      <Button onClick={() => retry()}>Reintentar</Button>
    </section>
  );
}
