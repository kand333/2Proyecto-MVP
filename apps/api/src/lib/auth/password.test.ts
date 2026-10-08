import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, verifyPasswordAgainstDummy } from "./password";

describe("password hashing", () => {
  it("stores scrypt parameters, salt and key, never the password", async () => {
    const hash = await hashPassword("clave segura 1");
    expect(hash).toMatch(/^scrypt\$131072\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(hash).not.toContain("clave");
  });

  it("uses a random salt, so the same password gives different hashes", async () => {
    expect(await hashPassword("clave segura 1")).not.toBe(await hashPassword("clave segura 1"));
  });

  it("accepts the right password and rejects any other", async () => {
    const hash = await hashPassword("clave segura 1");
    await expect(verifyPassword("clave segura 1", hash)).resolves.toBe(true);
    await expect(verifyPassword("clave segura 2", hash)).resolves.toBe(false);
    await expect(verifyPassword("", hash)).resolves.toBe(false);
  });

  it("never matches a malformed hash", async () => {
    for (const hash of ["", "plain-text", "bcrypt$1$2$3$a$b", "scrypt$x$8$1$c2FsdA==$a2V5"]) {
      await expect(verifyPassword("clave", hash)).resolves.toBe(false);
    }
  });

  it("rejects when checked against the dummy hash (unknown email)", async () => {
    await expect(verifyPasswordAgainstDummy("dummy-password-for-timing")).resolves.toBe(false);
  });
});
