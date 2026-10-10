import type { AdminOrderSummary } from "@portal/shared/order";
import type { PaginatedResponse } from "@portal/shared/pagination";
import type { Metadata } from "next";
import { AccessDenied } from "@/components/auth/access-denied";
import { AdminOrderList } from "@/components/orders/admin-order-list";
import { ADMIN_ORDERS_PATH, buildAdminOrderListApiPath, parseAdminOrderListParams } from "@/lib/admin-orders";
import { fetchWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Pedidos | Administración",
  robots: { index: false },
};

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser(ADMIN_ORDERS_PATH))) return <AccessDenied />;

  const params = parseAdminOrderListParams(await searchParams);
  const result = await fetchWithSession<PaginatedResponse<AdminOrderSummary>>(buildAdminOrderListApiPath(params));
  return <AdminOrderList result={result} params={params} />;
}
