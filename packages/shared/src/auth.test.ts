import { describe, expect, it } from "vitest";
import { changePasswordSchema, isAdult, loginSchema, registerSchema, shopToday, updateProfileSchema } from "./auth";

const firstMessage = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? null : result.error?.issues[0]?.message;

describe("registerSchema", () => {
  const valid = { name: "  Ana Rojas ", email: " Ana@Example.COM ", password: "clave segura 1", birthDate: "1990-05-17" };

  it("accepts a valid account, trimming the name and normalizing the email", () => {
    expect(registerSchema.parse(valid)).toEqual({
      name: "Ana Rojas",
      email: "ana@example.com",
      password: "clave segura 1",
      birthDate: "1990-05-17",
    });
  });

  it("keeps the password exactly as typed, spaces included", () => {
    expect(registerSchema.parse({ ...valid, password: " espacios " }).password).toBe(" espacios ");
  });

  it.each([
    [{ name: " " }, "Ingresa tu nombre"],
    [{ email: "ana@" }, "Ingresa un email válido, por ejemplo nombre@example.com"],
    [{ password: "corta" }, "La contraseña debe tener al menos 8 caracteres"],
    [{ password: "x".repeat(129) }, "La contraseña admite hasta 128 caracteres"],
    [{ birthDate: undefined }, "Ingresa tu fecha de nacimiento"],
    [{ birthDate: "" }, "Ingresa tu fecha de nacimiento"],
    [{ birthDate: "17/05/1990" }, "Ingresa una fecha válida"],
    [{ birthDate: "1990-02-30" }, "Ingresa una fecha válida"],
    [{ birthDate: "1899-12-31" }, "Ingresa una fecha válida"],
  ])("rejects %o", (override, message) => {
    expect(firstMessage(registerSchema.safeParse({ ...valid, ...override }))).toBe(message);
  });
});

describe("isAdult", () => {
  // 2026-10-08 02:00 UTC is still October 7 in Santiago (UTC-3).
  const now = new Date("2026-10-08T02:00:00Z");

  it("counts the date in Chile, not in UTC", () => {
    expect(shopToday(now)).toBe("2026-10-07");
  });

  it("accepts someone who turns 18 today and rejects someone who turns 18 tomorrow", () => {
    expect(isAdult("2008-10-07", now)).toBe(true);
    expect(isAdult("2008-10-08", now)).toBe(false);
    expect(isAdult("1990-01-01", now)).toBe(true);
  });

  it("treats a February 29 birthday as coming of age on March 1 in non-leap years", () => {
    expect(isAdult("2008-02-29", new Date("2026-02-28T15:00:00Z"))).toBe(false);
    expect(isAdult("2008-02-29", new Date("2026-03-01T15:00:00Z"))).toBe(true);
  });
});

describe("loginSchema", () => {
  it("normalizes the email and accepts any non-empty password", () => {
    expect(loginSchema.parse({ email: " ANA@example.com", password: "x" })).toEqual({
      email: "ana@example.com",
      password: "x",
    });
  });

  it("asks for the password when it is empty", () => {
    expect(firstMessage(loginSchema.safeParse({ email: "ana@example.com", password: "" }))).toBe(
      "Ingresa tu contraseña",
    );
  });
});

describe("updateProfileSchema", () => {
  it("normalizes like the registration and keeps the current password optional", () => {
    expect(updateProfileSchema.parse({ name: " Ana ", email: " ANA@test.com " })).toEqual({
      name: "Ana",
      email: "ana@test.com",
    });
    expect(updateProfileSchema.parse({ name: "Ana", email: "ana@test.com", currentPassword: "x" }).currentPassword).toBe(
      "x",
    );
  });

  it("rejects an invalid email", () => {
    expect(firstMessage(updateProfileSchema.safeParse({ name: "Ana", email: "ana@" }))).toBe(
      "Ingresa un email válido, por ejemplo nombre@example.com",
    );
  });
});

describe("changePasswordSchema", () => {
  it("accepts the current password and a valid new one", () => {
    expect(changePasswordSchema.parse({ currentPassword: "test1234", newPassword: "nueva clave 1" })).toEqual({
      currentPassword: "test1234",
      newPassword: "nueva clave 1",
    });
  });

  it.each([
    [{ currentPassword: "", newPassword: "nueva clave 1" }, "Ingresa tu contraseña actual"],
    [{ currentPassword: "test1234", newPassword: "corta" }, "La contraseña debe tener al menos 8 caracteres"],
    [{ currentPassword: "test1234", newPassword: "test1234" }, "La nueva contraseña debe ser distinta de la actual"],
  ])("rejects %o", (input, message) => {
    expect(firstMessage(changePasswordSchema.safeParse(input))).toBe(message);
  });
});
