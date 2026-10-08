import { describe, expect, it } from "vitest";
import { USER_ROLES } from "./enums";

describe("shared enums", () => {
  it("define the user roles", () => {
    expect(USER_ROLES).toEqual(["USER", "ADMIN"]);
  });
});
