import { describe, expect, it } from "vitest";
import { buildAdminProductListApiPath, parseAdminProductListParams, slugify, toAdminProductListQuery } from "./products";

describe("admin product list state", () => {
  it("reads page, search, category and status from the URL, dropping invalid values", () => {
    expect(parseAdminProductListParams({ page: "2", search: " limón ", category: "VAPES", status: "draft" })).toEqual({
      page: 2,
      search: "limón",
      category: "VAPES",
      status: "draft",
    });
    expect(parseAdminProductListParams({ page: "x", category: "FOOD", status: "deleted" })).toEqual({
      page: 1,
      search: "",
      category: undefined,
      status: undefined,
    });
  });

  it("writes the same names as the API, without defaults", () => {
    expect(toAdminProductListQuery({ page: 1, search: "" }).toString()).toBe("");
    expect(buildAdminProductListApiPath({ page: 3, search: "menta", category: "VAPES", status: "archived" })).toBe(
      "/api/admin/products?search=menta&category=VAPES&status=archived&page=3&pageSize=10",
    );
  });
});

describe("slugify", () => {
  it.each([
    ["Terpeno Limón 5 ml", "terpeno-limon-5-ml"],
    ["  Ñandú & Co.  ", "nandu-co"],
    ["---", ""],
  ])("%s → %s", (name, slug) => {
    expect(slugify(name)).toBe(slug);
  });
});

describe("public catalog state", () => {
  it("keeps only page, search and category, with the same names as the API", async () => {
    const { buildCatalogApiPath, parseCatalogParams } = await import("./products");
    expect(parseCatalogParams({ category: "E_LIQUIDS", status: "draft", search: "fresa" })).toEqual({ page: 1, search: "fresa", category: "E_LIQUIDS" });
    expect(buildCatalogApiPath({ page: 2, search: "", category: "VAPES" })).toBe("/api/products?category=VAPES&page=2&pageSize=12");
    expect(buildCatalogApiPath({ page: 1, search: "" }, { featured: true })).toBe("/api/products?featured=true&pageSize=12");
  });
});
