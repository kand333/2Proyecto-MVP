import "server-only";
import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const publicUserSelect = { id: true, name: true, email: true, role: true, isActive: true, sessionsValidAfter: true } as const;

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  sessionsValidAfter: Date | null;
};

export function findUserById(id: string): Promise<UserRecord | null> {
  return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
}

const LAST_SEEN_REFRESH_MS = 60 * 1000;

/**
 * Records activity, writing at most once a minute per user (the condition skips fresher rows), and
 * right away after a logout, so logging back in shows as online at once.
 */
export async function touchLastSeen(id: string, now = new Date()): Promise<void> {
  await prisma.user.updateMany({
    where: {
      id,
      OR: [
        { lastSeenAt: null },
        { lastSeenAt: { lt: new Date(now.getTime() - LAST_SEEN_REFRESH_MS) } },
        { loggedOutAt: { gte: prisma.user.fields.lastSeenAt } },
      ],
    },
    data: { lastSeenAt: now },
  });
}

/** On logout: the user stops showing as online at once; `lastSeenAt` stays as their last connection. */
export async function markLoggedOut(id: string, now = new Date()): Promise<void> {
  await prisma.user.updateMany({ where: { id }, data: { loggedOutAt: now } });
}

/** Includes the password hash: only for checking credentials. */
export function findUserCredentialsByEmail(email: string) {
  return prisma.user.findUnique({ where: { email }, select: { ...publicUserSelect, passwordHash: true } });
}

/** Includes the password hash: only for checking the current password. */
export function findUserCredentialsById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: { ...publicUserSelect, passwordHash: true } });
}

export function updateUser(
  id: string,
  data: { name?: string; email?: string; passwordHash?: string; sessionsValidAfter?: Date },
): Promise<UserRecord> {
  return prisma.user.update({ where: { id }, data, select: publicUserSelect });
}

export function insertUser(data: { name: string; email: string; passwordHash: string; birthDate: Date }): Promise<UserRecord> {
  return prisma.user.create({ data, select: publicUserSelect });
}
