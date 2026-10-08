import { describe, expect, it } from "vitest";
import { buildPageHref, buildPaginationItems, parsePageParam } from "./pagination";

describe("parsePageParam", () => {
  it("returns the page for positive integers", () => {
    expect(parsePageParam("1")).toBe(1);
    expect(parsePageParam("7")).toBe(7);
  });

  it.each([null, "", "0", "-1", "1.5", "abc", "2abc", " 2", "99999999999999999999"])(
    "falls back to page 1 for %o",
    (value) => {
      expect(parsePageParam(value)).toBe(1);
    },
  );
});

describe("buildPaginationItems", () => {
  it("lists every page when there are few", () => {
    expect(buildPaginationItems(1, 1)).toEqual([1]);
    expect(buildPaginationItems(2, 2)).toEqual([1, 2]);
    expect(buildPaginationItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("collapses distant pages into ellipses around the current page", () => {
    expect(buildPaginationItems(1, 20)).toEqual([1, 2, "ellipsis", 20]);
    expect(buildPaginationItems(10, 20)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 20]);
    expect(buildPaginationItems(20, 20)).toEqual([1, "ellipsis", 19, 20]);
  });

  it("shows a single hidden page as a number instead of an ellipsis", () => {
    expect(buildPaginationItems(4, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10]);
    expect(buildPaginationItems(7, 10)).toEqual([1, "ellipsis", 6, 7, 8, 9, 10]);
  });

  it("returns nothing when there are no pages", () => {
    expect(buildPaginationItems(1, 0)).toEqual([]);
  });
});

describe("buildPageHref", () => {
  it("sets the page and keeps the other parameters", () => {
    const searchParams = new URLSearchParams("status=active&search=demo");
    expect(buildPageHref("/items", searchParams, 3)).toBe("/items?status=active&search=demo&page=3");
  });

  it("replaces an existing page", () => {
    expect(buildPageHref("/items", new URLSearchParams("page=2&status=active"), 5)).toBe("/items?page=5&status=active");
  });

  it("drops the page parameter for the first page to keep URLs clean", () => {
    expect(buildPageHref("/items", new URLSearchParams("page=2&status=active"), 1)).toBe("/items?status=active");
    expect(buildPageHref("/items", new URLSearchParams("page=2"), 1)).toBe("/items");
  });

  it("does not mutate the given parameters", () => {
    const searchParams = new URLSearchParams("page=2");
    buildPageHref("/items", searchParams, 4);
    expect(searchParams.get("page")).toBe("2");
  });
});
