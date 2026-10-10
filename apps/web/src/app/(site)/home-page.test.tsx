import type { PublicProductSummary } from "@portal/shared/product";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { homeContent } from "@/lib/home-content";
import { fetchCatalog } from "@/lib/public-products-api";
import HomePage from "./page";

vi.mock("@/lib/public-products-api", () => ({ fetchCatalog: vi.fn() }));

const featured: PublicProductSummary[] = [
  { slug: "terpeno-limon", name: "Terpeno Limón", category: "TERPENES", priceFromClp: 8990, compareAtFromClp: 11990, inStock: true, coverUrl: null },
  { slug: "jeringa", name: "Jeringa", category: "ACCESSORIES", priceFromClp: 1490, compareAtFromClp: null, inStock: true, coverUrl: null },
];
const page = (data: PublicProductSummary[]) => ({ data, meta: { page: 1, pageSize: 12, total: data.length, totalPages: 1 } });
const render = async () => renderToStaticMarkup(await HomePage());

beforeEach(() => {
  vi.mocked(fetchCatalog).mockReset().mockResolvedValue(page(featured));
});

describe("home page", () => {
  it("renders the blocks of docs/design.md in order", async () => {
    const html = await render();
    const order = ['id="home-hero-title"', 'aria-label="Beneficios"', 'id="featured-title"', 'aria-label="Nuestra marca"', 'id="split-title"', 'aria-label="Quiénes somos"'];
    const positions = order.map((marker) => html.indexOf(marker));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("asks only for featured products and links the hero to the catalog", async () => {
    const html = await render();
    expect(fetchCatalog).toHaveBeenCalledWith({ page: 1, search: "" }, { featured: true });
    expect(html).toContain('href="/products/terpeno-limon"');
    expect(html).toMatch(/<a class="[^"]*" href="\/products">Explorar<svg/);
  });

  it("hides the featured collection when there is none, or when the API fails", async () => {
    vi.mocked(fetchCatalog).mockResolvedValue(page([]));
    expect(await render()).not.toContain('id="featured-title"');
    vi.mocked(fetchCatalog).mockRejectedValue(new Error("down"));
    const html = await render();
    expect(html).not.toContain('id="featured-title"');
    expect(html).toContain('id="home-hero-title"');
  });

  it("shows the brand panel while the images are missing, and the marquee twice with the copy hidden", async () => {
    expect(homeContent.hero.image).toBeNull();
    const html = await render();
    expect(html).toContain("bg-accent");
    expect(html).toContain("%2Fbrand%2Fterpenex-symbol.png");
    expect(html.match(/Envío a todo Chile/g)).toHaveLength(2);
    expect(html).toContain('<ul aria-hidden="true"');
  });

  it("uses no em or en dash in the visible copy", () => {
    expect(JSON.stringify(homeContent)).not.toMatch(/[—–]/);
  });
});
