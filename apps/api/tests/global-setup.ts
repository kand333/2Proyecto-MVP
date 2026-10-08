import { execSync } from "node:child_process";
import { loadEnvConfig } from "@next/env";

/**
 * Applies pending migrations to the test database before any test runs.
 * Refuses to run against a database whose name does not end with "_test",
 * because integration tests create and delete rows.
 */
export default function setup() {
  loadEnvConfig(process.cwd());

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return;

  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing to run integration tests against "${databaseName}": the database name must end with "_test".`,
    );
  }

  try {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, NODE_ENV: "test" },
      stdio: "pipe",
    });
  } catch (error) {
    const output = error instanceof Error && "stdout" in error ? String(error.stdout) : "";
    throw new Error(`Could not apply migrations to the test database.\n${output}`);
  }
}
