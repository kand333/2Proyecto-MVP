import { describe, expect, it } from "vitest";
import { subscribeSchema, welcomeCodePattern } from "./subscriber";

const issueOf = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? null : result.error?.issues[0]?.message;

describe("subscribeSchema", () => {
  it("normalizes the email and requires consent", () => {
    expect(subscribeSchema.parse({ email: " Ana@Example.COM ", marketingConsent: true })).toEqual({
      email: "ana@example.com",
      marketingConsent: true,
    });
  });

  it.each([false, undefined, "true"])("rejects marketing consent %s", (marketingConsent) => {
    expect(issueOf(subscribeSchema.safeParse({ email: "ana@example.com", marketingConsent }))).toBe(
      "Acepta recibir novedades para obtener tu código",
    );
  });

  it("rejects an invalid email", () => {
    expect(subscribeSchema.safeParse({ email: "ana", marketingConsent: true }).success).toBe(false);
  });
});

describe("welcomeCodePattern", () => {
  it("accepts the prefix plus 6 unambiguous characters", () => {
    expect(welcomeCodePattern.test("BIENVENIDA-K7MPQ2")).toBe(true);
    expect(welcomeCodePattern.test("BIENVENIDA-K7MPQ0")).toBe(false);
    expect(welcomeCodePattern.test("BIENVENIDA-K7MPQ")).toBe(false);
  });
});
