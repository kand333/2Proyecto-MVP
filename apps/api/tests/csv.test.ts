import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/lib/csv";

describe("csvCell", () => {
  it("leaves plain values as they are and empties null", () => {
    expect(csvCell("ana@example.com")).toBe("ana@example.com");
    expect(csvCell(42)).toBe("42");
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("quotes commas, quotes and line breaks, doubling inner quotes", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('dice "hola"')).toBe('"dice ""hola"""');
    expect(csvCell("línea 1\nlínea 2")).toBe('"línea 1\nlínea 2"');
  });

  it.each(["=cmd|' /C calc'!A0", "+1", "-1", "@SUM(A1)", "\tx", "\rx"])("neutralizes the formula %j with a leading quote", (value) => {
    expect(csvCell(value).replace(/^"/, "").startsWith("'")).toBe(true);
  });
});

describe("toCsv", () => {
  it("starts with the UTF-8 BOM and joins rows with CRLF", () => {
    const csv = toCsv(["email", "code"], [["ñandú@example.com", "BIENVENIDA-K7MPQ2"], ["=bad", null]]);
    expect(csv).toBe("﻿email,code\r\nñandú@example.com,BIENVENIDA-K7MPQ2\r\n'=bad,\r\n");
  });
});
