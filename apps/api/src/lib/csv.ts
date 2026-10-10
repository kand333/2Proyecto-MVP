import "server-only";

/** UTF-8 byte order mark: Excel then opens accents and "ñ" correctly. */
export const CSV_BOM = "﻿";

/** First characters that make a spreadsheet run a cell as a formula (CSV injection). */
const FORMULA_START = /^[=+\-@\t\r]/;

/**
 * One cell (RFC 4180, DEC-011): values that start like a formula get a leading `'`; values with a comma,
 * a quote or a line break are quoted, doubling inner quotes. null and undefined are empty cells.
 */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** A whole CSV document: BOM, header row and data rows, separated by CRLF as RFC 4180 asks. */
export function toCsv(header: readonly string[], rows: readonly (readonly (string | number | null | undefined)[])[]): string {
  return CSV_BOM + [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
