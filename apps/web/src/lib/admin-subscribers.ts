import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import { parsePageParam } from "./pagination";

export const ADMIN_SUBSCRIBERS_PATH = "/admin/subscribers";
/** 10 per page: 15 subscribers make 2 pages (RF-14). */
export const ADMIN_SUBSCRIBERS_PAGE_SIZE = 10;
/** CSV download of every subscriber (RF-20), through the same-origin /api proxy. */
export const SUBSCRIBERS_EXPORT_URL = "/api/admin/subscribers/export";

export type AdminSubscriberListParams = { page: number; search: string };

type PageSearchParams = Record<string, string | string[] | undefined>;

const firstValue = (value: string | string[] | undefined) => {
  const text = (Array.isArray(value) ? value[0] : value)?.trim();
  return text ? text : undefined;
};

export function parseAdminSubscriberListParams(searchParams: PageSearchParams): AdminSubscriberListParams {
  return {
    page: parsePageParam(firstValue(searchParams.page) ?? null),
    search: (firstValue(searchParams.search) ?? "").slice(0, MAX_SEARCH_LENGTH),
  };
}

export function toAdminSubscriberListQuery({ page, search }: AdminSubscriberListParams): URLSearchParams {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (page > 1) query.set("page", String(page));
  return query;
}

export function buildAdminSubscriberListApiPath(params: AdminSubscriberListParams): string {
  const query = toAdminSubscriberListQuery(params);
  query.set("pageSize", String(ADMIN_SUBSCRIBERS_PAGE_SIZE));
  return `/api/admin/subscribers?${query}`;
}
