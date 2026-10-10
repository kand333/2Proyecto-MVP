import { orderTokenPattern, type OrderView } from "@portal/shared/order";
import { apiInternalUrl } from "./api-internal-url";

/** An order by its secret token, for the Server Component of /orders/[token] (RF-09). Null → 404 page. */
export async function fetchOrderByToken(token: string): Promise<OrderView | null> {
  if (!orderTokenPattern.test(token)) return null;
  const response = await fetch(`${apiInternalUrl()}/api/orders/${token}`, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`No fue posible cargar el pedido (HTTP ${response.status})`);
  return response.json() as Promise<OrderView>;
}
