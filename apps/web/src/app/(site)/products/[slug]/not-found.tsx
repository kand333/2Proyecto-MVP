import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-5 px-4 py-24 sm:px-6">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-ink font-stretch-condensed">Producto no encontrado</h1>
      <p className="text-lg text-muted">Este producto no existe o ya no está disponible.</p>
      <Link href="/products" className={buttonClassName()}>
        Ver catálogo
      </Link>
    </section>
  );
}
