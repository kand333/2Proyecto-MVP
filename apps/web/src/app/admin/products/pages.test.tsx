import type { Product } from "@portal/shared/product";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithSession, findWithSession, getAdminUser } from "@/lib/session";
import EditProductPage from "./[id]/edit/page";
import NewProductPage from "./new/page";
import AdminProductsPage from "./page";

vi.mock("@/lib/session", () => ({ getAdminUser: vi.fn(), fetchWithSession: vi.fn(), findWithSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const admin = { id: "a1", name: "Admin", email: "admin@example.com", role: "ADMIN" as const, isActive: true };
const id = "11111111-1111-4111-8111-111111111111";
const product: Product = {
  id,
  slug: "terpeno-limon",
  name: "Terpeno Limón",
  description: "Cítrico",
  category: "TERPENES",
  isPublished: true,
  isArchived: false,
  isFeatured: true,
  variants: [
    { id: "v1", name: "1 ml", sku: "TER-LIM-1", priceClp: 8990, compareAtPriceClp: 11990, stock: 3, isActive: true, position: 0 },
    { id: "v2", name: "5 ml", sku: "TER-LIM-5", priceClp: 29990, compareAtPriceClp: null, stock: 0, isActive: true, position: 1 },
  ],
  images: [],
  createdAt: "2026-10-09T00:00:00.000Z",
  updatedAt: "2026-10-09T00:00:00.000Z",
};

const renderList = async (searchParams: Record<string, string>) =>
  renderToStaticMarkup(await AdminProductsPage({ searchParams: Promise.resolve(searchParams) } as PageProps<"/admin/products">));
const renderEdit = async (productId: string) =>
  renderToStaticMarkup(await EditProductPage({ params: Promise.resolve({ id: productId }) } as PageProps<"/admin/products/[id]/edit">));

beforeEach(() => {
  vi.mocked(getAdminUser).mockReset().mockResolvedValue(admin);
  vi.mocked(fetchWithSession).mockReset().mockResolvedValue({ data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 } });
  vi.mocked(findWithSession).mockReset();
});

describe("/admin/products", () => {
  it("asks the API with the filters of the URL", async () => {
    expect(await renderList({ search: "limón", category: "TERPENES", status: "draft", page: "2" })).toContain(">Productos</h1>");
    expect(getAdminUser).toHaveBeenCalledWith("/admin/products");
    expect(fetchWithSession).toHaveBeenCalledWith("/api/admin/products?search=lim%C3%B3n&category=TERPENES&status=draft&page=2&pageSize=10");
  });

  it("lists a featured product with its status, variants and edit link", async () => {
    vi.mocked(fetchWithSession).mockResolvedValue({ data: [product], meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 } });
    const html = await renderList({});
    expect(html).toContain(">Terpeno Limón</p>");
    expect(html).toContain(">Publicado</span>");
    expect(html).toContain(">Destacado</span>");
    expect(html).toContain("2 variantes");
    expect(html).toContain("$8.990");
    expect(html).toContain(`href="/admin/products/${id}/edit"`);
  });

  it("checks the role in every page, not only in the layout", async () => {
    vi.mocked(getAdminUser).mockResolvedValue(null);
    expect(await renderList({})).toContain("Acceso restringido");
    expect(renderToStaticMarkup(await NewProductPage())).toContain("Acceso restringido");
    expect(await renderEdit(id)).toContain("Acceso restringido");
    expect(fetchWithSession).not.toHaveBeenCalled();
    expect(findWithSession).not.toHaveBeenCalled();
  });

  it("edits an existing product with its variants and answers 404 for a missing one or an invalid id", async () => {
    vi.mocked(findWithSession).mockResolvedValue(product);
    const html = await renderEdit(id);
    expect(findWithSession).toHaveBeenCalledWith(`/api/admin/products/${id}`);
    expect(html).toContain('value="Terpeno Limón"');
    expect(html).toContain('value="TER-LIM-5"');
    expect(html).toContain('value="11990"');

    vi.mocked(findWithSession).mockResolvedValue(null);
    await expect(renderEdit(id)).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(renderEdit("x")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("starts a new product with one empty variant", () => {
    return NewProductPage().then((page) => {
      const html = renderToStaticMarkup(page);
      expect(html).toContain(">Nuevo producto</h1>");
      expect(html).toContain("Variante 1");
      expect(html).not.toContain("Variante 2");
      expect(html).toContain("Destacado en portada");
      expect(html).toContain("Precio anterior (CLP)");
    });
  });
});
