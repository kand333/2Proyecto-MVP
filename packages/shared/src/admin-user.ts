import { z } from "zod";
import { registerSchema } from "./auth";
import { USER_ROLES, type UserRole } from "./enums";
import { paginationQuerySchema } from "./pagination";

/** `active`: can log in. `inactive`: deactivated by ADMIN (cannot log in; sessions stop working). */
export const USER_STATUSES = ["active", "inactive"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** A user is "online" when their last authenticated request is this recent (sessions are stateless cookies). */
export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

// An empty query value (e.g. "?role=") means the filter is not used.
const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

/** Query of `GET /api/admin/users`: page, search over name and email, role and status. */
export const adminUserListQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  role: z.preprocess(emptyToUndefined, z.enum(USER_ROLES, { error: "Rol inválido" }).optional()),
  status: z.preprocess(emptyToUndefined, z.enum(USER_STATUSES, { error: "Estado inválido" }).optional()),
});
export type AdminUserListQuery = z.output<typeof adminUserListQuerySchema>;

const roleSchema = z.enum(USER_ROLES, { error: "Rol inválido" });

/**
 * Body of `POST /api/admin/users`: same rules as the public registration, plus the role. No birth
 * date: the checkout asks for it when the account has none.
 */
export const adminUserCreateSchema = registerSchema.omit({ birthDate: true }).extend({ role: roleSchema.default("USER") });
export type AdminUserCreate = z.output<typeof adminUserCreateSchema>;

/** Body of `PATCH /api/admin/users/{id}`: any of the user's data, status and role (a new password is optional). */
export const adminUserUpdateSchema = z
  .object({
    name: registerSchema.shape.name.optional(),
    email: registerSchema.shape.email.optional(),
    password: registerSchema.shape.password.optional(),
    isActive: z.boolean({ error: "Estado inválido" }).optional(),
    role: roleSchema.optional(),
  })
  .refine((update) => Object.values(update).some((value) => value !== undefined), {
    error: "Indica qué cambiar",
  });
export type AdminUserUpdate = z.output<typeof adminUserUpdateSchema>;

export const userIdSchema = z.uuid();

/** A row of the admin user list. */
export type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  /** Active and seen within `ONLINE_WINDOW_MS`. */
  isOnline: boolean;
  /** Last authenticated request (ISO), kept after logout: the "last connection". Null if never seen. */
  lastSeenAt: string | null;
  createdAt: string;
};
