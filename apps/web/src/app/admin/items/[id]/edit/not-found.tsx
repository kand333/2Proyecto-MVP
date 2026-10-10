import Link from "next/link";

export default function AdminItemNotFound() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-5 px-4 py-24 sm:px-6">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">Item no encontrado</h1>
      <p className="text-lg text-muted">Este item no existe o ya fue eliminado.</p>
      <Link
        href="/admin/items"
        className="inline-flex h-12 items-center rounded-sm bg-accent px-7 font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover"
      >
        Volver a items
      </Link>
    </section>
  );
}
