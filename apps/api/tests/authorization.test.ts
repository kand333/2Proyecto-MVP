import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Integration test: the authorization guards against real users of the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function requestWithSession(userId?: string) {
  const { createSessionToken } = await import("@/lib/auth/session-token");
  const headers = userId ? { cookie: `terpenex_session=${createSessionToken(userId)}` } : undefined;
  return new NextRequest("http://localhost:3000/api/protected", { headers });
}

async function rejection(guard: Promise<unknown>) {
  try {
    await guard;
    return null;
  } catch (error) {
    return { status: (error as { status?: number }).status, message: (error as Error).message };
  }
}

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("authorization guards", () => {
  let userId: string;
  let adminId: string;
  let inactiveAdminId: string;

  beforeAll(async () => {
    const prisma = await getPrisma();
    const base = { passwordHash: "scrypt$not-used-here" };
    userId = (await prisma.user.create({ data: { ...base, name: "User", email: `user-${testRunId}@example.com` } })).id;
    adminId = (
      await prisma.user.create({ data: { ...base, name: "Admin", email: `admin-${testRunId}@example.com`, role: "ADMIN" } })
    ).id;
    inactiveAdminId = (
      await prisma.user.create({
        data: { ...base, name: "Old admin", email: `old-${testRunId}@example.com`, role: "ADMIN", isActive: false },
      })
    ).id;
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("requireUser returns the session user, of any role", async () => {
    const { requireUser } = await import("@/lib/auth/authorization");
    await expect(requireUser(await requestWithSession(userId))).resolves.toMatchObject({ id: userId, role: "USER" });
    await expect(requireUser(await requestWithSession(adminId))).resolves.toMatchObject({ id: adminId, role: "ADMIN" });
  });

  it("requireUser rejects with 401 without a session, with a forged one or for a deactivated user", async () => {
    const { requireUser } = await import("@/lib/auth/authorization");
    const expected = { status: 401, message: "Debes iniciar sesión" };

    expect(await rejection(requireUser(await requestWithSession()))).toEqual(expected);
    expect(await rejection(requireUser(await requestWithSession(inactiveAdminId)))).toEqual(expected);
    const forged = new NextRequest("http://localhost:3000/api/protected", {
      headers: { cookie: "terpenex_session=forged.token" },
    });
    expect(await rejection(requireUser(forged))).toEqual(expected);
  });

  it("requireAdmin lets an ADMIN through and rejects a USER with 403", async () => {
    const { requireAdmin } = await import("@/lib/auth/authorization");
    await expect(requireAdmin(await requestWithSession(adminId))).resolves.toMatchObject({ role: "ADMIN" });
    expect(await rejection(requireAdmin(await requestWithSession(userId)))).toEqual({
      status: 403,
      message: "No tienes permisos para realizar esta acción",
    });
  });

  it("requireAdmin answers 401 (not 403) without a session", async () => {
    const { requireAdmin } = await import("@/lib/auth/authorization");
    expect((await rejection(requireAdmin(await requestWithSession())))?.status).toBe(401);
  });

  it("applies a role change on the next request", async () => {
    const { requireAdmin } = await import("@/lib/auth/authorization");
    const prisma = await getPrisma();
    const request = await requestWithSession(userId);

    await prisma.user.update({ where: { id: userId }, data: { role: "ADMIN" } });
    await expect(requireAdmin(request)).resolves.toMatchObject({ id: userId });
    await prisma.user.update({ where: { id: userId }, data: { role: "USER" } });
    expect((await rejection(requireAdmin(request)))?.status).toBe(403);
  });
});
