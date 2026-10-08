import { USER_ROLES } from "@portal/shared/enums";
import { describe, expect, it } from "vitest";
import { UserRole } from "@/generated/prisma/enums";

// The REST contract (@portal/shared) must stay aligned with the database enums.
describe("shared REST contract", () => {
  it("uses the same enum values as the Prisma schema", () => {
    expect([...USER_ROLES]).toEqual(Object.values(UserRole));
  });
});
