import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithSession, getAdminUser } from "@/lib/session";
import AdminUsersPage from "./page";

vi.mock("@/lib/session", () => ({ getAdminUser: vi.fn(), fetchWithSession: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const admin = { id: "a1", name: "Admin", email: "admin@test.com", role: "ADMIN" as const, isActive: true };
const render = async (searchParams: Record<string, string>) =>
  renderToStaticMarkup(await AdminUsersPage({ searchParams: Promise.resolve(searchParams) } as PageProps<"/admin/users">));

beforeEach(() => {
  vi.mocked(getAdminUser).mockReset().mockResolvedValue(admin);
  vi.mocked(fetchWithSession).mockReset().mockResolvedValue({ data: [], meta: { page: 1, pageSize: 12, total: 0, totalPages: 0 } });
});

describe("/admin/users", () => {
  it("asks the API with the search and filters of the URL", async () => {
    expect(await render({ search: "ana", role: "USER", status: "active" })).toContain(">Usuarios</h1>");
    expect(getAdminUser).toHaveBeenCalledWith("/admin/users");
    expect(fetchWithSession).toHaveBeenCalledWith("/api/admin/users?search=ana&role=USER&status=active&pageSize=10");
  });

  it("shows «Acceso restringido» to a non-admin without asking for the users", async () => {
    vi.mocked(getAdminUser).mockResolvedValue(null);
    expect(await render({})).toContain("Acceso restringido");
    expect(fetchWithSession).not.toHaveBeenCalled();
  });
});
