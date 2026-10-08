import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { ApiError } from "@/lib/http/api-error";
import {
  deleteUser,
  findAdminUsers,
  insertUserByAdmin,
  updateUserAccount,
  type AdminUserRecord,
} from "@/repositories/admin-user-repository";
import {
  ONLINE_WINDOW_MS,
  type AdminUserCreate,
  type AdminUserListQuery,
  type AdminUserSummary,
  type AdminUserUpdate,
} from "@portal/shared/admin-user";
import type { AuthUser } from "@portal/shared/auth";
import type { PaginatedResponse } from "@portal/shared/pagination";

const NOT_FOUND = "Usuario no encontrado";
const EMAIL_IN_USE = "Ya existe una cuenta con este email";
const OWN_ACCOUNT = "Tu propia cuenta se administra en «Mi cuenta»";

const isPrismaError = (error: unknown, code: string) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

/** Maps the database errors of a write: missing user → 404, email already used → 409. */
async function write<Result>(action: () => Promise<Result>): Promise<Result> {
  try {
    return await action();
  } catch (error) {
    if (isPrismaError(error, "P2025")) throw new ApiError(404, NOT_FOUND);
    if (isPrismaError(error, "P2002")) throw new ApiError(409, EMAIL_IN_USE);
    throw error;
  }
}

const toSummary = ({ createdAt, lastSeenAt, loggedOutAt, ...user }: AdminUserRecord, now = Date.now()): AdminUserSummary => ({
  ...user,
  isOnline:
    user.isActive &&
    lastSeenAt !== null &&
    lastSeenAt.getTime() >= now - ONLINE_WINDOW_MS &&
    (loggedOutAt === null || loggedOutAt < lastSeenAt),
  lastSeenAt: lastSeenAt?.toISOString() ?? null,
  createdAt: createdAt.toISOString(),
});

/** The viewing administrator first, then the users online now, then the rest. */
export async function listAdminUsers(query: AdminUserListQuery, viewerId: string, now = Date.now()): Promise<PaginatedResponse<AdminUserSummary>> {
  const { page, pageSize, search, role, status } = query;
  const { records, total } = await findAdminUsers(
    {
      searchTerms: (search ?? "").trim().split(/\s+/).filter(Boolean),
      role,
      isActive: status === undefined ? undefined : status === "active",
    },
    { viewerId, onlineSince: new Date(now - ONLINE_WINDOW_MS) },
    { skip: (page - 1) * pageSize, take: pageSize },
  );
  return { data: records.map((record) => toSummary(record, now)), meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

/** Creates an active account (USER or ADMIN) with the password given by ADMIN. */
export async function createUserByAdmin({ password, ...data }: AdminUserCreate): Promise<AdminUserSummary> {
  const passwordHash = await hashPassword(password);
  return toSummary(await write(() => insertUserByAdmin({ ...data, passwordHash })));
}

/**
 * Edits another user's data, status or role. An administrator cannot change their own account here
 * (it is edited in «Mi cuenta»): they can never remove their own role or deactivate themselves, so
 * there is always an active ADMIN. Changes apply on the user's next request.
 */
export async function updateUserByAdmin(admin: AuthUser, userId: string, update: AdminUserUpdate): Promise<AdminUserSummary> {
  if (userId === admin.id) throw new ApiError(409, OWN_ACCOUNT);
  const { password, ...changes } = update;
  const passwordHash = password === undefined ? undefined : await hashPassword(password);
  // A new password also logs the user out of every device.
  const sessionsValidAfter = passwordHash === undefined ? undefined : new Date();
  return toSummary(await write(() => updateUserAccount(userId, { ...changes, passwordHash, sessionsValidAfter })));
}

/** Deletes another user's account for good. */
export async function deleteUserByAdmin(admin: AuthUser, userId: string): Promise<void> {
  if (userId === admin.id) throw new ApiError(409, "No puedes eliminar tu propia cuenta");
  await write(() => deleteUser(userId));
}
