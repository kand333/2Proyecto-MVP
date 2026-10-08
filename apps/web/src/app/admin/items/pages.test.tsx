import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithSession, findWithSession, getAdminUser } from "@/lib/session";
import EditItemPage from "./[id]/edit/page";
import NewItemPage from "./new/page";
import AdminItemsPage from "./page";

vi.mock("@/lib/session", () => ({ getAdminUser: vi.fn(), fetchWithSession: vi.fn(), findWithSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const admin = { id: "a1", name: "Admin", email: "admin@example.com", role: "ADMIN" as const, isActive: true };
const id = "11111111-1111-4111-8111-111111111111";
const renderList = async (searchParams: Record<string, string>) =>
  renderToStaticMarkup(await AdminItemsPage({ searchParams: Promise.resolve(searchParams) } as PageProps<"/admin/items">));
const renderEdit = async (itemId: string) =>
  renderToStaticMarkup(await EditItemPage({ params: Promise.resolve({ id: itemId }) } as PageProps<"/admin/items/[id]/edit">));

beforeEach(() => {
  vi.mocked(getAdminUser).mockReset().mockResolvedValue(admin);
  vi.mocked(fetchWithSession).mockReset().mockResolvedValue({ data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 } });
  vi.mocked(findWithSession).mockReset();
});

describe("/admin/items", () => {
  it("asks the API with the page and search of the URL", async () => {
    expect(await renderList({ search: "uno", page: "2" })).toContain(">Items</h1>");
    expect(getAdminUser).toHaveBeenCalledWith("/admin/items");
    expect(fetchWithSession).toHaveBeenCalledWith("/api/admin/items?search=uno&page=2&pageSize=10");
  });

  it("checks the role in every page, not only in the layout", async () => {
    vi.mocked(getAdminUser).mockResolvedValue(null);
    expect(await renderList({})).toContain("Acceso restringido");
    expect(renderToStaticMarkup(await NewItemPage())).toContain("Acceso restringido");
    expect(await renderEdit(id)).toContain("Acceso restringido");
    expect(fetchWithSession).not.toHaveBeenCalled();
    expect(findWithSession).not.toHaveBeenCalled();
  });

  it("edits an existing item and answers 404 for a missing one or an invalid id", async () => {
    vi.mocked(findWithSession).mockResolvedValue({ id, title: "Primer item", description: "", isPublished: false, createdAt: "", updatedAt: "" });
    expect(await renderEdit(id)).toContain('value="Primer item"');
    expect(findWithSession).toHaveBeenCalledWith(`/api/admin/items/${id}`);

    vi.mocked(findWithSession).mockResolvedValue(null);
    await expect(renderEdit(id)).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(renderEdit("x")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
