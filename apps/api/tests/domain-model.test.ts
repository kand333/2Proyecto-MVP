import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { afterAll, describe, expect, it } from "vitest";

// Integration test: verifies defaults and constraints of the data model in PostgreSQL.
loadEnvConfig(process.cwd());
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

const testRunId = randomUUID().slice(0, 8);
const uniqueName = (label: string) => `${label}-${testRunId}-${randomUUID().slice(0, 8)}`;

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function createUser(overrides: { email?: string } = {}) {
  const prisma = await getPrisma();
  return prisma.user.create({
    data: {
      email: overrides.email ?? `${uniqueName("user")}@example.com`,
      passwordHash: "not-a-real-hash",
      name: "Test User",
    },
  });
}

describe.skipIf(!hasDatabaseUrl)("data model", () => {
  afterAll(async () => {
    const prisma = await getPrisma();
    const namePattern = { contains: testRunId };
    await prisma.item.deleteMany({ where: { title: namePattern } });
    await prisma.user.deleteMany({ where: { email: namePattern } });
    await prisma.$disconnect();
  });

  it("applies defaults to new users", async () => {
    const user = await createUser();
    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.role).toBe("USER");
    expect(user.isActive).toBe(true);
    expect(user.sessionsValidAfter).toBeNull();
  });

  it("rejects duplicated user emails", async () => {
    const email = `${uniqueName("duplicate")}@example.com`;
    await createUser({ email });
    await expect(createUser({ email })).rejects.toMatchObject({ code: "P2002" });
  });

  it("creates items unpublished by default", async () => {
    const prisma = await getPrisma();
    const item = await prisma.item.create({ data: { title: uniqueName("item"), description: "Test item" } });
    expect(item.isPublished).toBe(false);
    expect(item.createdAt).toBeInstanceOf(Date);
  });
});
