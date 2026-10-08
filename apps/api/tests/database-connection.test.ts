import { loadEnvConfig } from "@next/env";
import { afterAll, describe, expect, it } from "vitest";

// Integration test: requires a reachable PostgreSQL configured through DATABASE_URL.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabaseUrl)("database connection", () => {
  afterAll(async () => {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$disconnect();
  });

  it("executes a query against PostgreSQL through the application client", async () => {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.$queryRaw<{ result: number }[]>`SELECT 1 AS result`;
    expect(rows).toEqual([{ result: 1 }]);
  });
});
