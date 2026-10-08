import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminItemList } from "./admin-item-list";
import { ItemForm } from "./item-form";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const item = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Primer item",
  description: "Texto",
  isPublished: true,
  createdAt: "2026-10-01T12:00:00.000Z",
  updatedAt: "2026-10-01T12:00:00.000Z",
};
const page = (data: (typeof item)[], total = data.length) => ({ data, meta: { page: 1, pageSize: 10, total, totalPages: Math.ceil(total / 10) } });

describe("ItemForm", () => {
  it("starts empty and unpublished to create an item", () => {
    const html = renderToStaticMarkup(<ItemForm />);
    expect(html).toContain('name="title"');
    expect(html).toContain('name="description"');
    expect(html).not.toContain("checked");
    expect(html).toContain(">Crear item</button>");
  });

  it("is filled with the item to edit", () => {
    const html = renderToStaticMarkup(<ItemForm item={item} />);
    expect(html).toContain('value="Primer item"');
    expect(html).toContain(">Texto</textarea>");
    expect(html).toContain('checked=""');
    expect(html).toContain(">Guardar cambios</button>");
  });
});

describe("AdminItemList", () => {
  it("lists each item with its status and an edit link", () => {
    const html = renderToStaticMarkup(
      <AdminItemList result={page([item, { ...item, id: "22222222-2222-4222-8222-222222222222", isPublished: false }])} params={{ page: 1, search: "" }} />,
    );
    expect(html).toContain(">Publicado</span>");
    expect(html).toContain(">Borrador</span>");
    expect(html).toContain(`href="/admin/items/${item.id}/edit"`);
    expect(html).toContain('href="/admin/items/new"');
  });

  it("tells an empty list from an empty search", () => {
    expect(renderToStaticMarkup(<AdminItemList result={page([])} params={{ page: 1, search: "" }} />)).toContain("Aún no hay items");
    expect(renderToStaticMarkup(<AdminItemList result={page([])} params={{ page: 1, search: "x" }} />)).toContain("Ningún item coincide");
  });
});
