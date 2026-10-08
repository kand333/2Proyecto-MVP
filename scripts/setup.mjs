// Creates the local env files from the examples. Never overwrites an existing file.
// Usage: npm run setup
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const authSecret = () => randomBytes(48).toString("base64url");

function withValue(content, name, value) {
  return content.replace(new RegExp(`^${name}=.*$`, "m"), `${name}=${value}`);
}

function create(path, content) {
  if (existsSync(path)) {
    console.log(`skip    ${path} (already exists)`);
    return;
  }
  writeFileSync(path, content);
  console.log(`created ${path}`);
}

const apiExample = readFileSync("apps/api/.env.example", "utf8");
const databaseUrl = apiExample.match(/^DATABASE_URL=(.*)$/m)?.[1] ?? "";
const testDatabaseUrl = new URL(databaseUrl);
testDatabaseUrl.pathname = `${testDatabaseUrl.pathname}_test`;

create("apps/api/.env.local", withValue(apiExample, "AUTH_SECRET", authSecret()));
create(
  "apps/api/.env.test.local",
  `# Integration tests only (NODE_ENV=test). The database name must end with "_test".\nDATABASE_URL=${testDatabaseUrl}\nAUTH_SECRET=${authSecret()}\n`,
);
create("apps/web/.env.local", readFileSync("apps/web/.env.example", "utf8"));

console.log("\nNext: npm run db:up && npm run db:migrate && npm run db:seed && npm run dev");
