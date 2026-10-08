import type { Metadata } from "next";
import Link from "next/link";
import { PasswordForm, ProfileForm } from "@/components/account/account-edit-forms";
import { requireCustomerUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Editar cuenta",
  robots: { index: false },
};

export default async function AccountEditPage() {
  // Checked in the page too, not only in the layout (see lib/session.ts).
  // An ADMIN edits its data in /admin/account.
  const user = await requireCustomerUser("/account/edit", "/admin/account");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 sm:px-6">
      <Link
        href="/account"
        className="inline-flex text-sm font-semibold text-muted underline decoration-accent decoration-1 underline-offset-4 transition-colors duration-200 hover:text-ink"
      >
        Volver a mi cuenta
      </Link>
      <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight text-ink">Editar cuenta</h1>
      <p className="mt-3 text-lg text-muted">Actualiza tus datos y tu contraseña.</p>

      <div className="mt-10 space-y-8">
        <ProfileForm user={user} />
        <PasswordForm />
      </div>
    </div>
  );
}
