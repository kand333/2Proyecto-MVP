import type { PublicProduct, PublicProductSummary } from "@portal/shared/product";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCatalog, fetchPublicProduct } from "@/lib/public-products-api";
import ProductPage from "./[slug]/page";
import CatalogPage from "./page";

vi.mock("@/lib/public-products-api", () => ({ fetchCatalog: vi.fn(), fetchPublicProduct: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const summary: PublicProductSummary = { slug: "terpeno-limon", name: "Terpeno Limón", category: "TERPENES", priceFromClp: 8990, compareAtFromClp: 11990, inStock: true, coverUrl: null };
const page = (data: PublicProductSummary[]) => ({ data, meta: { page: 1, pageSize: 12, total: data.length, totalPages: 1 } });

const vape: PublicProduct = {
  slug: "vape-menta",
  name: "Vape Menta",
  description: "Sabor menta.",
  category: "VAPES",
  variants: [
    { id: "v1", name: "Negro", sku: "VAP-1", priceClp: 12990, compareAtPriceClp: null, inStock: false, lowStock: false },
    { id: "v2", name: "Verde", sku: "VAP-2", priceClp: 12990, compareAtPriceClp: 14990, inStock: true, lowStock: true },
  ],
  images: [],
};

const renderCatalog = async (searchParams: Record<string, string>) =>
  renderToStaticMarkup(await CatalogPage({ searchParams: Promise.resolve(searchParams) } as PageProps<"/products">));
const renderProduct = async (slug: string) =>
  renderToStaticMarkup(await ProductPage({ params: Promise.resolve({ slug }) } as PageProps<"/products/[slug]">));

beforeEach(() => {
  vi.mocked(fetchCatalog).mockReset().mockResolvedValue(page([summary]));
  vi.mocked(fetchPublicProduct).mockReset();
});

describe("/products", () => {
  it("asks for the category, search and page of the URL and shows the cards", async () => {
    const html = await renderCatalog({ category: "TERPENES", search: "limón", page: "2" });
    expect(fetchCatalog).toHaveBeenCalledWith({ page: 2, search: "limón", category: "TERPENES" });
    expect(html).toContain(">Terpenos</h1>");
    expect(html).toContain('href="/products/terpeno-limon"');
    expect(html).toContain(">Oferta</span>");
    expect(html).toContain('aria-current="page"');
  });

  it("offers to clear the filters when nothing matches", async () => {
    vi.mocked(fetchCatalog).mockResolvedValue(page([]));
    const html = await renderCatalog({ category: "VAPES" });
    expect(html).toContain("Ningún producto coincide con los filtros.");
    expect(html).toContain(">Ver todo el catálogo</a>");
  });
});

describe("/products/[slug]", () => {
  it("starts on the variant in stock and shows the nicotine warning for vapes", async () => {
    vi.mocked(fetchPublicProduct).mockResolvedValue(vape);
    const html = await renderProduct("vape-menta");
    expect(html).toContain(">Vape Menta</h1>");
    expect(html).toMatch(/<input[^>]*value="v2"[^>]*checked=""|<input[^>]*checked=""[^>]*value="v2"/);
    expect(html).toContain("Precio anterior </span>$14.990</s>");
    expect(html).toContain("Últimas unidades");
    expect(html).toContain('aria-label="Advertencia sanitaria"');
    expect(html).toMatch(/<button[^>]*>Añadir al carrito/);
    expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*>Añadir al carrito/);
  });

  it("shows «Agotado» and disables the button when no variant is in stock, without warning for terpenes", async () => {
    vi.mocked(fetchPublicProduct).mockResolvedValue({
      ...vape,
      category: "TERPENES",
      variants: [{ ...vape.variants[0]!, inStock: false }],
    });
    const html = await renderProduct("vape-menta");
    expect(html).toContain(">Agotado</p>");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Añadir al carrito/);
    expect(html).not.toContain("Advertencia sanitaria");
  });

  it("answers 404 for a product that is not visible", async () => {
    vi.mocked(fetchPublicProduct).mockResolvedValue(null);
    await expect(renderProduct("nada")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
