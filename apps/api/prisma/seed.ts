import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { getRequiredEnvironmentVariable } from "../src/lib/environment";
import { DEMO_PRODUCTS } from "./seed/products";
import { TEST_USER_PASSWORD, TEST_USERS } from "./seed/test-users";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const EXAMPLE_ITEMS = [
  { title: "Primer item", description: "Item publicado de ejemplo.", isPublished: true },
  { title: "Segundo item", description: "Otro item publicado de ejemplo.", isPublished: true },
  { title: "Borrador", description: "Item sin publicar: solo lo ve ADMIN.", isPublished: false },
];

// Entry point for `npm run db:seed` (development data only, idempotent). It runs with the
// "react-server" condition (see prisma.config.ts) so the server-only password module can be imported.
async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The development seed must not run in production.");
  }

  loadEnvConfig(process.cwd());
  const connectionString = getRequiredEnvironmentVariable("DATABASE_URL");
  // Known passwords must never reach a shared or production database.
  if (!LOCAL_HOSTS.has(new URL(connectionString).hostname)) {
    throw new Error("The development seed only runs against a local database (localhost).");
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const passwordHash = await hashPassword(TEST_USER_PASSWORD);
    for (const user of TEST_USERS) {
      await prisma.user.upsert({ where: { email: user.email }, update: {}, create: { ...user, passwordHash } });
    }
    if ((await prisma.item.count()) === 0) {
      await prisma.item.createMany({ data: EXAMPLE_ITEMS });
    }
    // By slug, and never overwritten: the admin may have edited a demo product since.
    for (const { variants, ...product } of DEMO_PRODUCTS) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: { ...product, variants: { create: variants.map((variant, position) => ({ ...variant, position })) } },
      });
    }

    console.log(`Seed completed. Users (password: ${TEST_USER_PASSWORD}):`);
    for (const user of TEST_USERS) console.log(`  ${user.role.padEnd(5)} ${user.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
