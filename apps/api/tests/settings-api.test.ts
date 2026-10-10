import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Integration test: shop settings (RF-10), against the test database. Restores the row afterwards.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const hasAuthSecret = (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32;

const testRunId = randomUUID().slice(0, 8);
const origin = "http://localhost:3000/api";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function sessionCookieFor(role: "USER" | "ADMIN") {
  const prisma = await getPrisma();
  const user = await prisma.user.create({
    data: { name: role, email: `${role.toLowerCase()}-settings-${testRunId}@example.com`, passwordHash: "scrypt$not-used-here", role },
  });
  const { createSessionToken } = await import("@/lib/auth/session-token");
  return `terpenex_session=${createSessionToken(user.id)}`;
}

const read = async (response: Response) => ({ status: response.status, body: await response.json() });

async function adminGet(cookie?: string) {
  const { GET } = await import("@/app/api/admin/settings/route");
  return read(await GET(new NextRequest(`${origin}/admin/settings`, { headers: cookie ? { cookie } : {} })));
}

async function adminPut(body: unknown, cookie?: string) {
  const { PUT } = await import("@/app/api/admin/settings/route");
  return read(
    await PUT(
      new NextRequest(`${origin}/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
        body: JSON.stringify(body),
      }),
    ),
  );
}

async function publicGet() {
  const { GET } = await import("@/app/api/settings/route");
  return read(await GET());
}

const settings = {
  flatShippingClp: 3990,
  freeShippingFromClp: 49990,
  pickupAddress: "Av. Siempre Viva 742, Santiago",
  transferInstructions: "Banco de prueba, cuenta 123",
};

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("settings API", () => {
  let adminCookie: string;
  let userCookie: string;
  let original: unknown;

  beforeAll(async () => {
    adminCookie = await sessionCookieFor("ADMIN");
    userCookie = await sessionCookieFor("USER");
    original = (await adminGet(adminCookie)).body;
  });

  afterAll(async () => {
    await adminPut(original, adminCookie);
    const prisma = await getPrisma();
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("answers 401 without a session and 403 to a USER", async () => {
    expect((await adminGet()).status).toBe(401);
    expect((await adminGet(userCookie)).status).toBe(403);
    expect((await adminPut(settings, userCookie)).status).toBe(403);
  });

  it("saves the settings and the public endpoint shows them without the transfer details", async () => {
    expect(await adminPut(settings, adminCookie)).toEqual({ status: 200, body: settings });
    expect(await adminGet(adminCookie)).toEqual({ status: 200, body: settings });
    expect(await publicGet()).toEqual({
      status: 200,
      body: { flatShippingClp: 3990, freeShippingFromClp: 49990, pickupAddress: "Av. Siempre Viva 742, Santiago" },
    });
  });

  it("accepts free delivery turned off", async () => {
    expect((await adminPut({ ...settings, freeShippingFromClp: null }, adminCookie)).body.freeShippingFromClp).toBeNull();
  });

  it("answers 400 for negative amounts and incomplete bodies, without saving", async () => {
    await adminPut(settings, adminCookie);
    expect(await adminPut({ ...settings, flatShippingClp: -1 }, adminCookie)).toEqual({
      status: 400,
      body: { message: "El costo de despacho no puede ser negativo", status: 400 },
    });
    expect((await adminPut({ ...settings, freeShippingFromClp: -10 }, adminCookie)).status).toBe(400);
    expect((await adminPut({ flatShippingClp: 1000 }, adminCookie)).status).toBe(400);
    expect((await adminGet(adminCookie)).body).toEqual(settings);
  });
});
