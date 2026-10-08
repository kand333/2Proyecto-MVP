import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Load .env* files with the same precedence rules as Next.js.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // react-server: lets the seed import server-only modules (password hashing of the test users).
    seed: "tsx --conditions=react-server prisma/seed.ts",
  },
  datasource: {
    // Optional here so `prisma generate` works without a database;
    // commands that connect fail with an explicit error when it is missing.
    url: process.env.DATABASE_URL,
  },
});
