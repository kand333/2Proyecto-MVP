import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { clearFailedLogins, isLoginBlocked, recordFailedLogin } from "@/lib/auth/login-rate-limit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { ApiError } from "@/lib/http/api-error";
import { findUserCredentialsById, updateUser } from "@/repositories/user-repository";
import { toAuthUser } from "@/services/auth-service";
import type { AuthUser, ChangePasswordData, UpdateProfileData } from "@portal/shared/auth";

/**
 * Confirms the current password before a sensitive change. Failures count towards the same limit
 * as the login (per account), so it cannot be used to guess the password.
 */
async function assertCurrentPassword(userId: string, password: string | undefined): Promise<void> {
  const attemptsKey = `account:${userId}`;
  if (isLoginBlocked(attemptsKey)) {
    throw new ApiError(429, "Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.");
  }
  const user = await findUserCredentialsById(userId);
  if (!user || !password || !(await verifyPassword(password, user.passwordHash))) {
    recordFailedLogin(attemptsKey);
    throw new ApiError(400, "La contraseña actual no es correcta");
  }
  clearFailedLogins(attemptsKey);
}

/** Updates name and email. Changing the email (it is the login) requires the current password. */
export async function updateProfile(user: AuthUser, data: UpdateProfileData): Promise<AuthUser> {
  const emailChanges = data.email !== user.email;
  if (emailChanges) await assertCurrentPassword(user.id, data.currentPassword);

  try {
    const updated = await updateUser(user.id, { name: data.name, ...(emailChanges ? { email: data.email } : {}) });
    return toAuthUser(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "Ya existe una cuenta con este email");
    }
    throw error;
  }
}

/**
 * Replaces the password after checking the current one, and revokes every session issued before
 * (other devices are logged out). The route renews the cookie of the current session.
 */
export async function changePassword(user: AuthUser, data: ChangePasswordData): Promise<void> {
  await assertCurrentPassword(user.id, data.currentPassword);
  await updateUser(user.id, { passwordHash: await hashPassword(data.newPassword), sessionsValidAfter: new Date() });
}
