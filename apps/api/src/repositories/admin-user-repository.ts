import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { UserRole } from "@/generated/prisma/enums";
import { escapeLikePattern } from "@/lib/escape-like";
import { prisma } from "@/lib/prisma";

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastSeenAt: true,
  loggedOutAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type AdminUserRecord = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>;

export type AdminUserFilters = { searchTerms: string[]; role?: UserRole; isActive?: boolean };

type Segment = { where: Prisma.UserWhereInput; orderBy: Prisma.UserOrderByWithRelationInput[] };

/**
 * Users for the admin list; every term must appear (ignoring case) in the name or the email.
 * Order: the viewing administrator, then the users online now (most recent first), then the rest
 * (ADMIN first: the enum sorts USER < ADMIN; then the newest). Each group is a query; the page is cut across them.
 */
export async function findAdminUsers(
  { searchTerms, role, isActive }: AdminUserFilters,
  { viewerId, onlineSince }: { viewerId: string; onlineSince: Date },
  pagination: { skip: number; take: number },
): Promise<{ records: AdminUserRecord[]; total: number }> {
  const where: Prisma.UserWhereInput = {
    role,
    isActive,
    AND: searchTerms.map((term) => {
      const contains = { contains: escapeLikePattern(term), mode: "insensitive" as const };
      return { OR: [{ name: contains }, { email: contains }] };
    }),
  };
  // Online: active, seen recently and not logged out since.
  const loggedOutSinceSeen: Prisma.UserWhereInput = { loggedOutAt: { gte: prisma.user.fields.lastSeenAt } };
  const online: Prisma.UserWhereInput = {
    isActive: true,
    lastSeenAt: { gte: onlineSince },
    OR: [{ loggedOutAt: null }, { loggedOutAt: { lt: prisma.user.fields.lastSeenAt } }],
  };
  // Spelled out instead of `NOT: online`: in SQL, NOT over a null column would leave those users out.
  const offline: Prisma.UserWhereInput = {
    OR: [{ isActive: false }, { lastSeenAt: null }, { lastSeenAt: { lt: onlineSince } }, loggedOutSinceSeen],
  };
  const segments: Segment[] = [
    { where: { id: viewerId }, orderBy: [] },
    { where: { id: { not: viewerId }, ...online }, orderBy: [{ lastSeenAt: "desc" }, { id: "desc" }] },
    { where: { id: { not: viewerId }, ...offline }, orderBy: [{ role: "desc" }, { createdAt: "desc" }, { id: "desc" }] },
  ];
  const totals = await prisma.$transaction(segments.map((segment) => prisma.user.count({ where: { AND: [where, segment.where] } })));

  const records: AdminUserRecord[] = [];
  let { skip, take } = pagination;
  for (const [index, segment] of segments.entries()) {
    const segmentTotal = totals[index] ?? 0;
    if (take === 0) break;
    if (skip >= segmentTotal) {
      skip -= segmentTotal;
      continue;
    }
    const page = await prisma.user.findMany({
      where: { AND: [where, segment.where] },
      orderBy: segment.orderBy,
      skip,
      take,
      select: adminUserSelect,
    });
    records.push(...page);
    take -= page.length;
    skip = 0;
  }
  return { records, total: totals.reduce((sum, count) => sum + count, 0) };
}

export type AdminUserChanges = {
  name?: string;
  email?: string;
  passwordHash?: string;
  sessionsValidAfter?: Date;
  isActive?: boolean;
  role?: UserRole;
};

export function insertUserByAdmin(data: { name: string; email: string; passwordHash: string; role: UserRole }) {
  return prisma.user.create({ data, select: adminUserSelect });
}

/** Changes the user's data, status and/or role. Throws P2025 when missing, P2002 for a used email. */
export function updateUserAccount(id: string, data: AdminUserChanges) {
  return prisma.user.update({ where: { id }, data, select: adminUserSelect });
}

/** Deletes the account for good. Throws P2025 when the user does not exist. */
export function deleteUser(id: string) {
  return prisma.user.delete({ where: { id }, select: { id: true } });
}
