import { describe, expect, it } from "vitest";
import { buildItemListApiPath, parseItemListParams, toItemListQuery } from "./items";

describe("parseItemListParams", () => {
  it("reads page and search from the URL", () => {
    expect(parseItemListParams({ page: "3", search: " uno " })).toEqual({ page: 3, search: "uno" });
  });

  it("falls back to the defaults for missing or invalid values", () => {
    expect(parseItemListParams({})).toEqual({ page: 1, search: "" });
    expect(parseItemListParams({ page: "-2", search: ["dos", "tres"] })).toEqual({ page: 1, search: "dos" });
  });
});

describe("toItemListQuery", () => {
  it("leaves out the defaults", () => {
    expect(toItemListQuery({ page: 1, search: "" }).toString()).toBe("");
    expect(toItemListQuery({ page: 2, search: "uno" }).toString()).toBe("search=uno&page=2");
  });
});

describe("buildItemListApiPath", () => {
  it("adds the page size to the list state", () => {
    expect(buildItemListApiPath("/api/admin/items", { page: 2, search: "uno" }, 10)).toBe("/api/admin/items?search=uno&page=2&pageSize=10");
  });
});
