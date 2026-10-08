// REST contract enums. They must match the Prisma enums in apps/api/prisma/schema.prisma
// (verified by apps/api/tests/shared-contract.test.ts).

export const USER_ROLES = ["USER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];
