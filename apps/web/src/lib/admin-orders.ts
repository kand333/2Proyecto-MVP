import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import { ORDER_STATUSES, type AdminOrder, type OrderStatus, type OrderStatusChange } from "@portal/shared/order";
import { sendJson } from "./api-client";
import { parsePageParam } from "./pagination";

export const ADMIN_ORDERS_PATH = "/admin/orders";
export const ADMIN_ORDERS_PAGE_SIZE = 20;

/** Admin list state kept in the URL, with the same parameter names as the API (RF-15). */
export type AdminOrderListParams = { page: number; search: string; status?: OrderStatus };

type PageSearchParams = Record<string, string | string[] | undefined>;

const firstValue = (value: string | string[] | undefined) => {
  const text = (Array.isArray(value) ? value[0] : value)?.trim();
  return text ? text : undefined;
};

export function parseAdminOrderListParams(searchParams: PageSearchParams): AdminOrderListParams {
  const status = firstValue(searchParams.status);
  return {
    page: parsePageParam(firstValue(searchParams.page) ?? null),
    search: (firstValue(searchParams.search) ?? "").slice(0, MAX_SEARCH_LENGTH),
    status: ORDER_STATUSES.find((candidate) => candidate === status),
  };
}

export function toAdminOrderListQuery({ page, search, status }: AdminOrderListParams): URLSearchParams {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (status) query.set("status", status);
  if (page > 1) query.set("page", String(page));
  return query;
}

export function buildAdminOrderListApiPath(params: AdminOrderListParams): string {
  const query = toAdminOrderListQuery(params);
  query.set("pageSize", String(ADMIN_ORDERS_PAGE_SIZE));
  return `/api/admin/orders?${query}`;
}

export const changeOrderStatus = (id: string, change: OrderStatusChange) => sendJson<AdminOrder>("PATCH", `/api/admin/orders/${id}/status`, change);

/** Button label of each target status, and the notice once done (same verb, docs/design.md). */
export const STATUS_ACTIONS: Record<OrderStatus, { label: string; done: string }> = {
  PENDING_PAYMENT: { label: "Marcar pendiente", done: "Pedido pendiente." },
  PAID: { label: "Marcar pagado", done: "Pedido marcado como pagado." },
  SHIPPED: { label: "Marcar enviado", done: "Pedido marcado como enviado." },
  DELIVERED: { label: "Marcar entregado", done: "Pedido marcado como entregado." },
  CANCELLED: { label: "Cancelar pedido", done: "Pedido cancelado: stock repuesto." },
};
