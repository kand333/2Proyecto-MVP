import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const requiredVariableNames = ["DATABASE_URL", "AUTH_SECRET", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];

const secretVariableNames = ["AUTH_SECRET", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];

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

describe("apps/api .env.example", () => {
  const environmentVariables = parseEnvironmentFile(readFileSync(resolve(process.cwd(), ".env.example"), "utf8"));

  it("declares every backend variable", () => {
    for (const variableName of requiredVariableNames) {
      expect(environmentVariables.has(variableName), variableName).toBe(true);
    }
  });

  it("does not contain secret values", () => {
    for (const variableName of secretVariableNames) {
      expect(environmentVariables.get(variableName), variableName).toBe("");
    }
  });

  it("points DATABASE_URL to a local database, never a real one", () => {
    expect(new URL(environmentVariables.get("DATABASE_URL") ?? "").hostname).toBe("localhost");
  });

  it("does not expose anything to the browser", () => {
    expect([...environmentVariables.keys()].filter((name) => name.startsWith("NEXT_PUBLIC_"))).toEqual([]);
  });
});
