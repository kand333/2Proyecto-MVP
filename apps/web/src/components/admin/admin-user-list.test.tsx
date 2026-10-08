import type { AdminUserSummary } from "@portal/shared/admin-user";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AdminUserListParams } from "@/lib/admin-users";
import { AdminUserList, presenceLabel } from "./admin-user-list";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const user = (overrides: Partial<AdminUserSummary>): AdminUserSummary => ({
  id: "u1",
  name: "Ana García",
  email: "ana@test.com",
  role: "USER",
  isActive: true,
  isOnline: false,
  lastSeenAt: null,
  createdAt: "2026-09-01T12:00:00.000Z",
  ...overrides,
});

const render = (users: AdminUserSummary[], params: AdminUserListParams = { page: 1, search: "" }, total = users.length) =>
  renderToStaticMarkup(
    <AdminUserList
      result={{ data: users, meta: { page: params.page, pageSize: 10, total, totalPages: Math.ceil(total / 10) } }}
      params={params}
      currentAdminId="admin"
    />,
  );

describe("AdminUserList", () => {
  it("offers creating a user in a collapsible panel above the list", () => {
    const html = render([]);
    expect(html).toMatch(/<details[^>]*><summary[^>]*>[^]*Nuevo usuario/);
    expect(html).toContain('aria-label="Crear usuario"');
    expect(html.indexOf("Nuevo usuario")).toBeLessThan(html.indexOf("Buscar por nombre o email"));
  });

  it("lists each user with initials, role, status, and registration date", () => {
    const html = render([user({}), user({ id: "u2", name: "Luis Pérez", role: "ADMIN", isActive: false })]);
    for (const header of ["Usuario", "Rol", "Estado", "Registro", "Acciones"]) expect(html).toContain(`>${header}</th>`);
    expect(html).toContain(">AG</span>");
    expect(html).toContain(">Admin</span>");
    expect(html).toContain(">Activo<");
    expect(html).toContain(">Inactivo<");
    expect(html).toContain("1–2 de 2 usuarios");
  });

  it("shows in green only the users online right now, whatever their role", () => {
    const html = render([
      user({ id: "online", isOnline: true }),
      user({ id: "admin-offline", role: "ADMIN" }),
      user({ id: "inactive", role: "ADMIN", isActive: false }),
    ]);
    expect(html.match(/text-emerald-700/g)).toHaveLength(1);
    expect(html).toMatch(/title="Conectado ahora" class="[^"]*text-emerald-700[^"]*">[^]*?Activo[^]*?conectado ahora/);
    expect(html.match(/>Activo</g)).toHaveLength(2);
  });

  it("shows the last connection on hover for users who are not online", () => {
    expect(presenceLabel({ isOnline: true, lastSeenAt: "2026-10-04T18:30:00.000Z" })).toBe("Conectado ahora");
    // 18:30 UTC is 15:30 in Santiago (UTC-3 in October).
    expect(presenceLabel({ isOnline: false, lastSeenAt: "2026-10-04T18:30:00.000Z" })).toMatch(/^Última conexión: .*2026.*15:30/);
    expect(presenceLabel({ isOnline: false, lastSeenAt: null })).toBe("Sin conexiones registradas");
    const html = render([user({ lastSeenAt: "2026-10-04T18:30:00.000Z" }), user({ id: "never" })]);
    expect(html).toMatch(/title="Última conexión: [^"]*15:30"/);
    expect(html).toContain('title="Sin conexiones registradas"');
  });

  it("offers edit, status and delete for other users, not for the administrator's own row", () => {
    const html = render([user({}), user({ id: "admin", name: "Ada Admin", role: "ADMIN" })]);
    expect(html).toContain('aria-label="Editar a Ana García"');
    expect(html).toContain('aria-label="Desactivar a Ana García"');
    expect(html).toContain('aria-label="Eliminar a Ana García"');
    expect(html).not.toContain('aria-label="Eliminar a Ada Admin"');
    expect(html).toContain("Se edita en «Mi cuenta»");
    expect(html).toContain("(tú)");
  });

  it("paginates and keeps the filters in the URL", () => {
    const html = render(
      Array.from({ length: 10 }, (_, index) => user({ id: `u${index}` })),
      { page: 2, search: "ana", role: "ADMIN", status: "inactive" },
      25,
    );
    expect(html).toContain("11–20 de 25 usuarios");
    expect(html).toContain('href="/admin/users?search=ana&amp;role=ADMIN&amp;status=inactive&amp;page=3"');
    expect(html).toContain('<option value="ADMIN" selected="">Administrador</option>');
    expect(html).toContain(">Limpiar</a>");
  });

  it("explains an empty result", () => {
    expect(render([])).toContain("Ningún usuario coincide con la búsqueda o los filtros.");
  });
});
