import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PaginatedResponse } from "@portal/shared/pagination";
import { welcomeCodePattern, type AdminSubscriber } from "@portal/shared/subscriber";

// Integration test: subscription with welcome code (RF-12) and the admin list (RF-14), against the test database.
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
    data: { name: role, email: `${role.toLowerCase()}-subscribers-${testRunId}@example.com`, passwordHash: "scrypt$not-used-here", role },
  });
  const { createSessionToken } = await import("@/lib/auth/session-token");
  return `terpenex_session=${createSessionToken(user.id)}`;
}

const read = async (response: Response) => ({ status: response.status, body: await response.json() });

async function subscribe(body: unknown, ip = "203.0.113.10") {
  const { POST } = await import("@/app/api/subscribers/route");
  return read(
    await POST(
      new Request(`${origin}/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
        body: JSON.stringify(body),
      }),
    ),
  );
}

async function list(query: string, cookie?: string) {
  const { GET } = await import("@/app/api/admin/subscribers/route");
  return read(await GET(new NextRequest(`${origin}/admin/subscribers${query}`, { headers: cookie ? { cookie } : {} })));
}

const emailOf = (label: string) => `${label}-${testRunId}@example.com`;

describe.skipIf(!hasDatabaseUrl || !hasAuthSecret)("subscribers API", () => {
  let adminCookie: string;
  let userCookie: string;

  beforeAll(async () => {
    adminCookie = await sessionCookieFor("ADMIN");
    userCookie = await sessionCookieFor("USER");
  });

  beforeEach(async () => {
    const { resetRateLimits } = await import("@/lib/http/rate-limit");
    resetRateLimits();
  });

  afterAll(async () => {
    const prisma = await getPrisma();
    await prisma.subscriber.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.$disconnect();
  });

  it("gives a new email a welcome code and the same code on the second subscription", async () => {
    const first = await subscribe({ email: `  ${emailOf("Ana").toUpperCase()} `, marketingConsent: true });
    expect(first.status).toBe(201);
    expect(first.body.code).toMatch(welcomeCodePattern);

    const again = await subscribe({ email: emailOf("ana"), marketingConsent: true });
    expect(again).toEqual({ status: 200, body: { code: first.body.code } });
  });

  it("answers 400 without consent or with an invalid body", async () => {
    expect(await subscribe({ email: emailOf("sin-consentimiento"), marketingConsent: false })).toEqual({
      status: 400,
      body: { message: "Acepta recibir novedades para obtener tu código", status: 400 },
    });
    expect((await subscribe({ email: "no-es-email", marketingConsent: true })).status).toBe(400);
    const prisma = await getPrisma();
    expect(await prisma.subscriber.count({ where: { email: emailOf("sin-consentimiento") } })).toBe(0);
  });

  it("limits subscriptions per connection with 429", async () => {
    for (let index = 0; index < 10; index += 1) {
      expect((await subscribe({ email: emailOf(`limite-${index}`), marketingConsent: true }, "203.0.113.99")).status).toBe(201);
    }
    const limited = await subscribe({ email: emailOf("limite-extra"), marketingConsent: true }, "203.0.113.99");
    expect(limited.status).toBe(429);
  });

  it("exports the subscribers as an escaped CSV attachment for an ADMIN only", async () => {
    const { GET } = await import("@/app/api/admin/subscribers/export/route");
    const download = (cookie?: string) => GET(new NextRequest(`${origin}/admin/subscribers/export`, { headers: cookie ? { cookie } : {} }));
    expect((await download()).status).toBe(401);
    expect((await download(userCookie)).status).toBe(403);

    await subscribe({ email: emailOf("csv"), marketingConsent: true });
    const response = await download(adminCookie);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="subscribers.csv"');
    expect(response.headers.get("cache-control")).toBe("no-store");
    // Response.text() drops the BOM when decoding: check the raw bytes.
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
    expect(text.startsWith("﻿email,code,consentAt,redeemedAt\r\n")).toBe(true);
    const row = text.split("\r\n").find((line) => line.startsWith(`${emailOf("csv")},`));
    expect(row).toMatch(/^[^,]+,BIENVENIDA-[A-Z0-9]{6},\d{4}-\d{2}-\d{2}T[^,]+,$/);
  });

  it("lists subscribers for an ADMIN only, newest first, with search and redemption state", async () => {
    await subscribe({ email: emailOf("lista-a"), marketingConsent: true });
    await subscribe({ email: emailOf("lista-b"), marketingConsent: true });

    expect((await list("")).status).toBe(401);
    expect((await list("", userCookie)).status).toBe(403);

    const { status, body } = await list(`?search=lista-&pageSize=50`, adminCookie);
    expect(status).toBe(200);
    const page = body as PaginatedResponse<AdminSubscriber>;
    const ours = page.data.filter((subscriber) => subscriber.email.includes(testRunId));
    expect(ours.map((subscriber) => subscriber.email)).toEqual([emailOf("lista-b"), emailOf("lista-a")]);
    expect(ours[0]).toEqual({ email: emailOf("lista-b"), code: expect.stringMatching(welcomeCodePattern), consentAt: expect.any(String), redeemedAt: null });
  });
});
