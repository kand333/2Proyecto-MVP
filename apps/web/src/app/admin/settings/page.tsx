import type { ShopSettings } from "@portal/shared/settings";
import type { Metadata } from "next";
import { AccessDenied } from "@/components/auth/access-denied";
import { SettingsForm } from "@/components/settings/settings-form";
import { ADMIN_SETTINGS_PATH } from "@/lib/settings";
import { fetchWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Ajustes de tienda | Administración",
  robots: { index: false },
};

export default async function AdminSettingsPage() {
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser(ADMIN_SETTINGS_PATH))) return <AccessDenied />;

  const settings = await fetchWithSession<ShopSettings>("/api/admin/settings");
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">Ajustes de tienda</h1>
      <p className="mt-3 max-w-prose text-muted">El carrito y el checkout usan estos valores apenas los guardas.</p>
      <div className="mt-8">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
