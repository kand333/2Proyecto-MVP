import { describe, expect, it } from "vitest";
import { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from "./auth";

const firstMessage = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? null : result.error?.issues[0]?.message;

describe("registerSchema", () => {
  const valid = { name: "  Ana Rojas ", email: " Ana@Example.COM ", password: "clave segura 1" };

  it("accepts a valid account, trimming the name and normalizing the email", () => {
    expect(registerSchema.parse(valid)).toEqual({
      name: "Ana Rojas",
      email: "ana@example.com",
      password: "clave segura 1",
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
  ])("rejects %o", (override, message) => {
    expect(firstMessage(registerSchema.safeParse({ ...valid, ...override }))).toBe(message);
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
