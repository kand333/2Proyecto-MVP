import { describe, expect, it } from "vitest";
import { getRequiredEnvironmentVariable } from "./environment";

describe("getRequiredEnvironmentVariable", () => {
  it("returns the value when the variable is defined", () => {
    expect(getRequiredEnvironmentVariable("DATABASE_URL", { DATABASE_URL: "postgresql://x" })).toBe(
      "postgresql://x",
    );
  });

  it("trims surrounding whitespace", () => {
    expect(getRequiredEnvironmentVariable("DATABASE_URL", { DATABASE_URL: "  value \n" })).toBe("value");
  });

  it("throws a descriptive error when the variable is missing", () => {
    expect(() => getRequiredEnvironmentVariable("DATABASE_URL", {})).toThrow(
      "Missing required environment variable: DATABASE_URL",
    );
  });

  it("throws when the variable is empty or blank", () => {
    expect(() => getRequiredEnvironmentVariable("DATABASE_URL", { DATABASE_URL: "" })).toThrow();
    expect(() => getRequiredEnvironmentVariable("DATABASE_URL", { DATABASE_URL: "   " })).toThrow();
  });
});
