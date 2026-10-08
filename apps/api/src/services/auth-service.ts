import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { clearFailedLogins, isLoginBlocked, recordFailedLogin } from "@/lib/auth/login-rate-limit";
import type { Session } from "@/lib/auth/session-token";
import { hashPassword, verifyPassword, verifyPasswordAgainstDummy } from "@/lib/auth/password";
import { ApiError } from "@/lib/http/api-error";
import { findUserById, findUserCredentialsByEmail, insertUser, touchLastSeen, type UserRecord } from "@/repositories/user-repository";
import type { AuthUser, LoginData, RegisterData } from "@portal/shared/auth";

const INVALID_CREDENTIALS = "Email o contraseña incorrectos";

export const toAuthUser = ({ id, name, email, role, isActive }: UserRecord): AuthUser => ({ id, name, email, role, isActive });

/** Creates a USER account. The email arrives normalized (trimmed, lowercase) from the schema. */
export async function registerUser(data: RegisterData): Promise<AuthUser> {
  const passwordHash = await hashPassword(data.password);
  try {
    return toAuthUser(await insertUser({ name: data.name, email: data.email, passwordHash }));
  } catch (error) {
    // The unique index on email also covers two registrations at the same time.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "Ya existe una cuenta con este email");
    }
    throw error;
  }
}

/**
 * Checks the credentials. The same message is used for an unknown email and a wrong password, and
 * an unknown email costs the same time, so the response does not reveal which emails exist.
 */
export async function authenticateUser(data: LoginData, now = Date.now()): Promise<AuthUser> {
  if (isLoginBlocked(data.email, now)) {
    throw new ApiError(429, "Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.");
  }

  const user = await findUserCredentialsByEmail(data.email);
  const isValid = user
    ? await verifyPassword(data.password, user.passwordHash)
    : await verifyPasswordAgainstDummy(data.password);
  if (!user || !isValid) {
    recordFailedLogin(data.email, now);
    throw new ApiError(401, INVALID_CREDENTIALS);
  }

  clearFailedLogins(data.email);
  if (!user.isActive) {
    throw new ApiError(403, "Tu cuenta está desactivada. Contacta al administrador.");
  }
  return toAuthUser(user);
}

/**
 * A session issued before the last password change is no longer valid. Compared in whole seconds
 * (the token precision): a session issued in that same second is kept, so the one renewed by the
 * change itself stays valid.
 */
export const isRevoked = (issuedAt: number, sessionsValidAfter: Date | null) =>
  sessionsValidAfter !== null && issuedAt < Math.floor(sessionsValidAfter.getTime() / 1000);

/** The user of a session, or null when it no longer exists, was deactivated or the session was revoked. */
export async function getActiveUser({ userId, issuedAt }: Session): Promise<AuthUser | null> {
  const user = await findUserById(userId);
  if (!user?.isActive || isRevoked(issuedAt, user.sessionsValidAfter)) return null;
  await touchLastSeen(user.id);
  return toAuthUser(user);
}
