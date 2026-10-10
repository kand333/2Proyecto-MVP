import type { PaginatedResponse } from "@portal/shared/pagination";
import type { Product } from "@portal/shared/product";
import type { Metadata } from "next";
import { AccessDenied } from "@/components/auth/access-denied";
import { AdminProductList } from "@/components/products/admin-product-list";
import { buildAdminProductListApiPath, parseAdminProductListParams } from "@/lib/products";
import { fetchWithSession, getAdminUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Productos | Administración",
  robots: { index: false },
};

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser("/admin/products"))) return <AccessDenied />;

  const params = parseAdminProductListParams(await searchParams);
  const result = await fetchWithSession<PaginatedResponse<Product>>(buildAdminProductListApiPath(params));
  return <AdminProductList result={result} params={params} />;
}
