import type { Metadata } from "next";
import { PasswordForm, ProfileForm } from "@/components/account/account-edit-forms";
import { AccessDenied } from "@/components/auth/access-denied";
import { getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Mi cuenta | Administración",
  robots: { index: false },
};

/** The administrator's own data and password (the public /account is for USER accounts only). */
export default async function AdminAccountPage() {
  // Checked here too: the layout check alone does not keep this content out of the response.
  const admin = await getAdminUser("/admin/account");
  if (!admin) return <AccessDenied />;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 sm:px-6">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">Mi cuenta</h1>
      <p className="mt-3 text-lg text-muted">Tus datos de administrador y tu contraseña.</p>
      <div className="mt-10 space-y-8">
        <ProfileForm user={admin} />
        <PasswordForm />
      </div>
    </div>
  );
}
