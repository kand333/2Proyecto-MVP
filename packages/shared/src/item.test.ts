import { describe, expect, it } from "vitest";
import { ITEM_TITLE_MAX_LENGTH, itemCreateSchema, itemListQuerySchema, itemUpdateSchema } from "./item";

describe("itemCreateSchema", () => {
  it("trims the text and applies the defaults", () => {
    expect(itemCreateSchema.parse({ title: "  Uno  " })).toEqual({ title: "Uno", description: "", isPublished: false });
  });

  it("requires a title within the limit", () => {
    expect(itemCreateSchema.safeParse({ title: "   " }).error?.issues[0]?.message).toBe("Ingresa un título");
    expect(itemCreateSchema.safeParse({ title: "x".repeat(ITEM_TITLE_MAX_LENGTH + 1) }).success).toBe(false);
  });
});

describe("itemUpdateSchema", () => {
  it("accepts any single field and rejects an empty change", () => {
    expect(itemUpdateSchema.parse({ isPublished: true })).toEqual({ isPublished: true });
    expect(itemUpdateSchema.safeParse({}).error?.issues[0]?.message).toBe("Indica qué cambiar");
  });
});

describe("itemListQuerySchema", () => {
  it("reads page, page size and search from query strings", () => {
    expect(itemListQuerySchema.parse({ page: "2", pageSize: "5", search: " uno " })).toEqual({ page: 2, pageSize: 5, search: "uno" });
    expect(itemListQuerySchema.parse({ search: "" })).toEqual({ page: 1, pageSize: 12, search: undefined });
  });
});
