import { describe, expect, it } from "vitest";
import { adminUserCreateSchema, adminUserListQuerySchema, adminUserUpdateSchema } from "./admin-user";

describe("adminUserListQuerySchema", () => {
  it("reads page, search, role and status, ignoring empty values", () => {
    expect(adminUserListQuerySchema.parse({ page: "2", search: "ana", role: "ADMIN", status: "inactive" })).toEqual({
      page: 2,
      pageSize: 12,
      search: "ana",
      role: "ADMIN",
      status: "inactive",
    });
    expect(adminUserListQuerySchema.parse({ role: "", status: "" })).toMatchObject({ role: undefined, status: undefined });
  });

  it("rejects an unknown role or status", () => {
    expect(adminUserListQuerySchema.safeParse({ role: "OWNER" }).success).toBe(false);
    expect(adminUserListQuerySchema.safeParse({ status: "banned" }).success).toBe(false);
  });
});

describe("adminUserUpdateSchema", () => {
  it("accepts data, status and role; the email is normalized", () => {
    expect(adminUserUpdateSchema.parse({ name: " Ana ", email: " ANA@Test.com " })).toEqual({ name: "Ana", email: "ana@test.com" });
    expect(adminUserUpdateSchema.parse({ isActive: false })).toEqual({ isActive: false });
    expect(adminUserUpdateSchema.parse({ role: "ADMIN", isActive: true })).toEqual({ role: "ADMIN", isActive: true });
  });

  it.each([
    [{}, "Indica qué cambiar"],
    [{ email: "no-es-email" }, "Ingresa un email válido, por ejemplo nombre@example.com"],
    [{ password: "corta" }, "La contraseña debe tener al menos 8 caracteres"],
    [{ isActive: "no" }, "Estado inválido"],
    [{ role: "OWNER" }, "Rol inválido"],
  ])("rejects %o", (input, message) => {
    const result = adminUserUpdateSchema.safeParse(input);
    expect(result.success ? null : result.error.issues[0].message).toBe(message);
  });
});

describe("adminUserCreateSchema", () => {
  it("uses the registration rules and defaults to USER", () => {
    expect(adminUserCreateSchema.parse({ name: "Ana", email: "Ana@Test.com", password: "secreto123" })).toEqual({
      name: "Ana",
      email: "ana@test.com",
      password: "secreto123",
      role: "USER",
    });
    expect(adminUserCreateSchema.parse({ name: "Ana", email: "a@b.cl", password: "secreto123", role: "ADMIN" }).role).toBe("ADMIN");
    expect(adminUserCreateSchema.safeParse({ name: "Ana", email: "a@b.cl", password: "corta" }).success).toBe(false);
  });
});
