import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AdminDashboardStats } from "@portal/shared/admin";

// Integration test: the dashboard counts against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function sessionCookieFor(role: "USER" | "ADMIN") {
  const prisma = await getPrisma();
  const user = await prisma.user.create({
    data: { name: role, email: `${role.toLowerCase()}-${testRunId}@example.com`, passwordHash: "scrypt$not-used-here", role },
  });
  const { createSessionToken } = await import("@/lib/auth/session-token");
  return `terpenos_session=${createSessionToken(user.id)}`;
}

async function getDashboard(cookie?: string) {
  const { GET } = await import("@/app/api/admin/dashboard/route");
  const response = await GET(
    new NextRequest("http://localhost:3000/api/admin/dashboard", cookie ? { headers: { cookie } } : undefined),
  );
  return { status: response.status, body: await response.json() };
}

/** Counts computed directly, to compare with the endpoint (other test files may add rows). */
async function expectedStats(): Promise<AdminDashboardStats> {
  const prisma = await getPrisma();
  return {
    users: await prisma.user.count(),
    items: {
      total: await prisma.item.count(),
      published: await prisma.item.count({ where: { isPublished: true } }),
    },
  };
}


describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("admin dashboard API", () => {
  let adminCookie: string;
  let userCookie: string;

  beforeAll(async () => {
    adminCookie = await sessionCookieFor("ADMIN");
    userCookie = await sessionCookieFor("USER");
    const prisma = await getPrisma();
    await prisma.item.createMany({
      data: [
        { title: `Published ${testRunId}`, description: "Test item", isPublished: true },
        { title: `Draft ${testRunId}`, description: "Test item" },
      ],
    });
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.item.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("answers 401 without a session and 403 to a USER", async () => {
    expect((await getDashboard()).status).toBe(401);
    expect(await getDashboard(userCookie)).toEqual({
      status: 403,
      body: { message: "No tienes permisos para realizar esta acción", status: 403 },
    });
  });

  it("gives an ADMIN the counts of users and items (also unpublished)", async () => {
    const { status, body } = await getDashboard(adminCookie);
    expect(status).toBe(200);
    expect(body).toEqual(await expectedStats());

    const stats = body as AdminDashboardStats;
    expect(stats.items.total).toBeGreaterThanOrEqual(2);
    expect(stats.items.published).toBeLessThan(stats.items.total);
    expect(stats.users).toBeGreaterThanOrEqual(2);
  });
});
