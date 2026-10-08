import type { AdminUserSummary } from "@portal/shared/admin-user";
import type { PaginatedResponse } from "@portal/shared/pagination";
import type { Metadata } from "next";
import { AdminUserList } from "@/components/admin/admin-user-list";
import { AccessDenied } from "@/components/auth/access-denied";
import { buildAdminUsersApiPath, parseAdminUserListParams } from "@/lib/admin-users";
import { fetchWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Usuarios | Administración",
  robots: { index: false },
};

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  // Checked here too: the layout check alone does not keep this content out of the response.
  const admin = await getAdminUser("/admin/users");
  if (!admin) return <AccessDenied />;

  const params = parseAdminUserListParams(await searchParams);
  const result = await fetchWithSession<PaginatedResponse<AdminUserSummary>>(buildAdminUsersApiPath(params));
  return <AdminUserList result={result} params={params} currentAdminId={admin.id} />;
}
