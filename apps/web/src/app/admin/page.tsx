import type { AdminDashboardStats } from "@portal/shared/admin";
import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AccessDenied } from "@/components/auth/access-denied";
import { fetchWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Administración",
  robots: { index: false },
};

export default async function AdminPage() {
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser("/admin"))) return <AccessDenied />;

  const stats = await fetchWithSession<AdminDashboardStats>("/api/admin/dashboard");
  return <AdminDashboard stats={stats} />;
}
