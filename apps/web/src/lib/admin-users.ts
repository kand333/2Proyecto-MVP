import {
  USER_STATUSES,
  type AdminUserCreate,
  type AdminUserSummary,
  type AdminUserUpdate,
  type UserStatus,
} from "@portal/shared/admin-user";
import { USER_ROLES, type UserRole } from "@portal/shared/enums";
import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import { sendJson } from "./api-client";
import { parsePageParam } from "./pagination";

export const ADMIN_USERS_PATH = "/admin/users";

/** Users per page of the admin list. */
export const ADMIN_USERS_PAGE_SIZE = 10;

export type AdminUserListParams = { page: number; search: string; role?: UserRole; status?: UserStatus };

type PageSearchParams = Record<string, string | string[] | undefined>;

const firstValue = (value: string | string[] | undefined) => {
  const text = (Array.isArray(value) ? value[0] : value)?.trim();
  return text ? text : undefined;
};
const oneOf = <Value extends string>(values: readonly Value[], text: string | undefined) => values.find((value) => value === text);

/** Reads the list state from the URL; invalid values are dropped. */
export function parseAdminUserListParams(searchParams: PageSearchParams): AdminUserListParams {
  return {
    page: parsePageParam(firstValue(searchParams.page) ?? null),
    search: (firstValue(searchParams.search) ?? "").slice(0, MAX_SEARCH_LENGTH),
    role: oneOf(USER_ROLES, firstValue(searchParams.role)),
    status: oneOf(USER_STATUSES, firstValue(searchParams.status)),
  };
}

/** The same state as a query string, without the defaults (page URL and page links). */
export function toAdminUserListQuery({ page, search, role, status }: AdminUserListParams): URLSearchParams {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (role) query.set("role", role);
  if (status) query.set("status", status);
  if (page > 1) query.set("page", String(page));
  return query;
}

export function buildAdminUsersApiPath(params: AdminUserListParams): string {
  const query = toAdminUserListQuery(params);
  query.set("pageSize", String(ADMIN_USERS_PAGE_SIZE));
  return `/api/admin/users?${query}`;
}

/** Values of the edit form. An empty password means «keep the current one». */
export type UserEditValues = { name: string; email: string; password: string; role: UserRole; isActive: boolean };

/** Only what changed, so the API receives (and the confirmation lists) just that. */
export function diffUserChanges(user: AdminUserSummary, values: UserEditValues): AdminUserUpdate {
  const changes: AdminUserUpdate = {};
  if (values.name.trim() !== user.name) changes.name = values.name;
  if (values.email.trim().toLowerCase() !== user.email) changes.email = values.email;
  if (values.password) changes.password = values.password;
  if (values.role !== user.role) changes.role = values.role;
  if (values.isActive !== user.isActive) changes.isActive = values.isActive;
  return changes;
}

export function createUser(data: AdminUserCreate): Promise<AdminUserSummary> {
  return sendJson<AdminUserSummary>("POST", "/api/admin/users", data);
}

/** Edits a user's data, status and/or role. */
export function updateUser(userId: string, update: AdminUserUpdate): Promise<AdminUserSummary> {
  return sendJson<AdminUserSummary>("PATCH", `/api/admin/users/${userId}`, update);
}

/** Deletes a user for good. */
export function deleteUser(userId: string): Promise<void> {
  return sendJson<void>("DELETE", `/api/admin/users/${userId}`);
}
