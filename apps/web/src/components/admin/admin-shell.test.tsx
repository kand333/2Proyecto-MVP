import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminShell } from "./admin-shell";

const { pathname } = vi.hoisted(() => ({ pathname: { value: "/admin" } }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value, useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const admin = { id: "a1", name: "Ada Admin", email: "admin@test.com", role: "ADMIN" as const, isActive: true };
const render = (path: string) => {
  pathname.value = path;
  return renderToStaticMarkup(
    <AdminShell user={admin}>
      <p>Contenido</p>
    </AdminShell>,
  );
};

describe("AdminShell", () => {
  it("shows the sections in order, the content and the main landmark", () => {
    const html = render("/admin");
    const labels = [...html.matchAll(/<span class="truncate">([^<]+)<\/span>/g)].map((match) => match[1]);
    expect(labels.slice(0, 4)).toEqual(["Panel administración", "Administrar items", "Administrar usuarios", "Mi cuenta"]);
    expect(html).toContain('<main id="main-content"');
    expect(html).toContain("<p>Contenido</p>");
    expect(html).toContain("Saltar al contenido principal");
  });

  it("marks the current section, including its sub-pages", () => {
    expect(render("/admin/items/new")).toMatch(/<a aria-current="page"[^>]*href="\/admin\/items">/);
    expect(render("/admin")).toMatch(/<a aria-current="page"[^>]*href="\/admin">/);
  });

  it("offers collapsing the sidebar, a mobile menu, the public site and logging out", () => {
    const html = render("/admin");
    expect(html).toContain('aria-label="Contraer menú"');
    expect(html).toContain('aria-label="Abrir menú de administración"');
    expect(html).toContain(">Ver sitio<");
    expect(html).toContain(">Salir<");
    expect(html).toContain("Ada Admin");
  });
});
