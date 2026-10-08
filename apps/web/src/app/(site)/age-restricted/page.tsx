import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso solo para adultos",
  robots: { index: false },
};

/** Where the age notice sends visitors who say they are under 18 (RF-04): no catalog here. */
export default function AgeRestrictedPage() {
  return (
    <section aria-labelledby="age-restricted-title" className="mx-auto flex w-full max-w-3xl flex-col items-start gap-5 px-4 py-24 sm:px-6">
      <h1 id="age-restricted-title" className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Acceso solo para adultos
      </h1>
      <p className="max-w-prose text-lg leading-relaxed text-muted">
        Esta tienda vende productos solo a personas mayores de 18 años. No puedes ver el catálogo ni comprar.
      </p>
    </section>
  );
}
