import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithSession, getAdminUser } from "@/lib/session";
import AdminLayout from "./layout";
import AdminPage from "./page";

vi.mock("@/lib/session", () => ({ getAdminUser: vi.fn(), fetchWithSession: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/admin", useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const admin = { id: "a1", name: "Admin", email: "admin@test.com", role: "ADMIN" as const, isActive: true };

const renderLayout = async () =>
  renderToStaticMarkup(await AdminLayout({ children: <p>Contenido de administración</p> } as LayoutProps<"/admin">));
const renderPage = async () => renderToStaticMarkup(await AdminPage());

const stats = { users: 4, items: { total: 3, published: 2 } };

beforeEach(() => {
  vi.mocked(getAdminUser).mockReset();
  vi.mocked(fetchWithSession).mockReset().mockResolvedValue(stats);
});

describe("admin section", () => {
  it("shows the layout content and the page to an ADMIN", async () => {
    vi.mocked(getAdminUser).mockResolvedValue(admin);
    const layout = await renderLayout();
    expect(layout).toContain("Contenido de administración");
    // Its own frame: the admin sidebar, not the public navigation.
    expect(layout).toContain('aria-label="Secciones de administración"');
    expect(layout).not.toContain(">Ingresar<");
    expect(await renderPage()).toContain("Panel administración");
    expect(getAdminUser).toHaveBeenCalledWith("/admin");
    expect(fetchWithSession).toHaveBeenCalledWith("/api/admin/dashboard");
  });

  it("shows «Acceso restringido» instead of the content to a non-admin, in the layout and in the page", async () => {
    vi.mocked(getAdminUser).mockResolvedValue(null);

    const layout = await renderLayout();
    expect(layout).toContain("Acceso restringido");
    expect(layout).not.toContain("Contenido de administración");

    // The page checks on its own: the layout alone does not keep its content out of the response.
    const page = await renderPage();
    expect(page).toContain("Acceso restringido");
    expect(page).not.toContain("Panel administración");
    // Nor are the indicators requested for a non-admin.
    expect(fetchWithSession).not.toHaveBeenCalled();
  });
});
