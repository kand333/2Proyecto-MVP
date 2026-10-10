import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const requiredVariableNames = ["NEXT_PUBLIC_SITE_URL", "API_INTERNAL_URL"];

// Backend-only variables that must never reach the frontend app.
const backendVariableNames = ["DATABASE_URL", "AUTH_SECRET", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];

function parseEnvironmentFile(content: string): Map<string, string> {
  const variables = new Map<string, string>();
  for (const line of content.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (trimmedLine === "" || trimmedLine.startsWith("#")) continue;
    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) continue;
    variables.set(trimmedLine.slice(0, separatorIndex).trim(), trimmedLine.slice(separatorIndex + 1).trim());
  }
  return variables;
}

describe("apps/web .env.example", () => {
  const environmentVariables = parseEnvironmentFile(readFileSync(resolve(process.cwd(), ".env.example"), "utf8"));

  it("declares every frontend variable", () => {
    for (const variableName of requiredVariableNames) {
      expect(environmentVariables.has(variableName), variableName).toBe(true);
    }
  });

  it("does not declare backend secrets, with or without the NEXT_PUBLIC_ prefix", () => {
    for (const variableName of backendVariableNames) {
      expect(environmentVariables.has(variableName), variableName).toBe(false);
      expect(environmentVariables.has(`NEXT_PUBLIC_${variableName}`), variableName).toBe(false);
    }
  });
});
