import { AdminShell } from "@/components/admin/admin-shell";
import { AccessDenied } from "@/components/auth/access-denied";
import { getAdminUser } from "@/lib/session";

/**
 * Every page under /admin is for ADMIN only, inside its own corporate frame (no public header or
 * footer): visitors go to the login, a USER sees a 403 message.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await getAdminUser("/admin");
  if (!admin) {
    return (
      <main id="main-content" className="flex flex-1 flex-col">
        <AccessDenied />
      </main>
    );
  }
  return <AdminShell user={admin}>{children}</AdminShell>;
}
