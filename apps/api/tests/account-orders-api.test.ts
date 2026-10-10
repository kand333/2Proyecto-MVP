import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AccountOrderSummary } from "@portal/shared/order";

// Integration test: a customer's own orders (RF-16) against the test database.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const origin = "http://localhost:3100/api";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function list(cookie?: string) {
  const { GET } = await import("@/app/api/account/orders/route");
  const response = await GET(new NextRequest(`${origin}/account/orders`, { headers: cookie ? { cookie } : {} }));
  return { status: response.status, body: await response.json() };
}

async function get(id: string, cookie: string) {
  const { GET } = await import("@/app/api/account/orders/[id]/route");
  const response = await GET(new NextRequest(`${origin}/account/orders/${id}`, { headers: { cookie } }), { params: Promise.resolve({ id }) });
  return { status: response.status, body: await response.json() };
}

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("account orders API", () => {
  const cookies: Record<string, string> = {};
  const orderIds: Record<string, string[]> = { ana: [], beto: [] };

  async function orderFor(email: string, userId: string | null) {
    const prisma = await getPrisma();
    const { newAccessToken } = await import("@/services/order-service");
    return prisma.order.create({
      data: {
        accessToken: newAccessToken(),
        userId,
        email,
        name: "Cliente",
        phone: "+56 9 1234 5678",
        birthDate: new Date("1990-01-01"),
        shippingMethod: "PICKUP",
        subtotalClp: 1000,
        shippingClp: 0,
        totalClp: 1000,
      },
    });
  }

  beforeAll(async () => {
    const prisma = await getPrisma();
    const { createSessionToken } = await import("@/lib/auth/session-token");
    for (const name of ["ana", "beto"] as const) {
      const email = `${name}-cuenta-${testRunId}@example.com`;
      const user = await prisma.user.create({ data: { name, email, passwordHash: "scrypt$not-used-here" } });
      cookies[name] = `terpenex_session=${createSessionToken(user.id)}`;
      if (name === "ana") {
        orderIds.ana.push((await orderFor(email, user.id)).id, (await orderFor(email, user.id)).id);
        // A guest order with the same email: never linked to the account.
        await orderFor(email, null);
      } else {
        orderIds.beto.push((await orderFor(email, user.id)).id);
      }
    }
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.order.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("answers 401 without a session", async () => {
    expect((await list()).status).toBe(401);
  });

  it("lists only the orders placed with the account, newest first", async () => {
    const { status, body } = await list(cookies.ana);
    expect(status).toBe(200);
    expect((body as AccountOrderSummary[]).map((order) => order.id)).toEqual([...orderIds.ana].reverse());
  });

  it("shows the detail of an own order and 404 for another user's", async () => {
    expect((await get(orderIds.ana[0] as string, cookies.ana as string)).body).toMatchObject({ status: "PENDING_PAYMENT", items: [] });
    expect((await get(orderIds.beto[0] as string, cookies.ana as string)).status).toBe(404);
    expect((await get("x", cookies.ana as string)).status).toBe(404);
  });
});
