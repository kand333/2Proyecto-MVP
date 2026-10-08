import type { Item } from "@portal/shared/item";
import type { PaginatedResponse } from "@portal/shared/pagination";
import type { Metadata } from "next";
import { AccessDenied } from "@/components/auth/access-denied";
import { AdminItemList } from "@/components/items/admin-item-list";
import { ADMIN_ITEMS_PAGE_SIZE, buildItemListApiPath, parseItemListParams } from "@/lib/items";
import { fetchWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Items | Administración",
  robots: { index: false },
};

export default async function AdminItemsPage({ searchParams }: PageProps<"/admin/items">) {
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser("/admin/items"))) return <AccessDenied />;

  const params = parseItemListParams(await searchParams);
  const result = await fetchWithSession<PaginatedResponse<Item>>(buildItemListApiPath("/api/admin/items", params, ADMIN_ITEMS_PAGE_SIZE));
  return <AdminItemList result={result} params={params} />;
}
