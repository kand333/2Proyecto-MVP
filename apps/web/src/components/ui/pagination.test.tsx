import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Pagination } from "./pagination";

const render = (currentPage: number, totalPages: number, query = "") =>
  renderToStaticMarkup(
    <Pagination pathname="/items" searchParams={new URLSearchParams(query)} currentPage={currentPage} totalPages={totalPages} />,
  );

describe("Pagination", () => {
  it("renders nothing for a single page or no pages", () => {
    expect(render(1, 1)).toBe("");
    expect(render(1, 0)).toBe("");
  });

  it("is a labelled navigation marking the current page", () => {
    const html = render(2, 3);
    expect(html).toContain('aria-label="Paginación"');
    expect(html).toContain('aria-current="page"');
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-label="Página 2"[^>]*>|aria-current="page"[^>]*aria-label="Página 2"/);
  });

  it("links every page and keeps the other query parameters", () => {
    const html = render(1, 3, "status=active");
    expect(html).toContain('href="/items?status=active&amp;page=2"');
    expect(html).toContain('href="/items?status=active&amp;page=3"');
    expect(html).toContain('href="/items?status=active"');
  });

  it("disables previous on the first page and next on the last", () => {
    const first = render(1, 3);
    expect(first).toContain('aria-disabled="true"');
    expect(first).not.toContain('rel="prev"');
    expect(first).toContain('rel="next"');

    const last = render(3, 3);
    expect(last).toContain('rel="prev"');
    expect(last).not.toContain('rel="next"');
  });

  it("sends the previous link of an out-of-range page to the last existing page", () => {
    const html = render(99, 2);
    expect(html).toContain('rel="prev"');
    expect(html).toContain('href="/items?page=2"');
    expect(html).not.toContain("page=98");
  });

  it("hides distant pages behind an ellipsis for long listings", () => {
    const html = render(10, 20);
    expect(html).toContain("…");
    expect(html).toContain('aria-label="Página 20"');
    expect(html).not.toContain('aria-label="Página 5"');
  });
});
