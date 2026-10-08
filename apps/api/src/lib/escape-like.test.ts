import { describe, expect, it } from "vitest";
import { escapeLikePattern } from "./escape-like";

describe("escapeLikePattern", () => {
  it("leaves ordinary text untouched", () => {
    expect(escapeLikePattern("providencia")).toBe("providencia");
    expect(escapeLikePattern("Año 3D")).toBe("Año 3D");
    expect(escapeLikePattern("")).toBe("");
  });

  it("escapes the percent and underscore wildcards", () => {
    expect(escapeLikePattern("100%")).toBe("100\\%");
    expect(escapeLikePattern("a_b")).toBe("a\\_b");
  });

  it("escapes the escape character itself first so it cannot neutralize the others", () => {
    expect(escapeLikePattern("\\")).toBe("\\\\");
    expect(escapeLikePattern("\\%")).toBe("\\\\\\%");
  });

  it("escapes every occurrence", () => {
    expect(escapeLikePattern("%_%_")).toBe("\\%\\_\\%\\_");
  });
});
