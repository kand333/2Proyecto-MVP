import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithSession, getAdminUser } from "@/lib/session";
import AdminSubscribersPage from "./page";

vi.mock("@/lib/session", () => ({ getAdminUser: vi.fn(), fetchWithSession: vi.fn() }));

const admin = { id: "a1", name: "Admin", email: "admin@example.com", role: "ADMIN" as const, isActive: true };
const subscriber = (index: number, redeemed = false) => ({
  email: `persona-${index}@example.com`,
  code: `BIENVENIDA-AAAAA${index % 10}`,
  consentAt: "2026-10-10T15:00:00.000Z",
  redeemedAt: redeemed ? "2026-10-11T15:00:00.000Z" : null,
});

const render = async (searchParams: Record<string, string>) =>
  renderToStaticMarkup(await AdminSubscribersPage({ searchParams: Promise.resolve(searchParams) } as PageProps<"/admin/subscribers">));

beforeEach(() => {
  vi.mocked(getAdminUser).mockReset().mockResolvedValue(admin);
  vi.mocked(fetchWithSession).mockReset();
});

describe("/admin/subscribers", () => {
  it("pages 15 subscribers by 10, with date, code and redemption state, and the CSV export link", async () => {
    vi.mocked(fetchWithSession).mockResolvedValue({
      data: Array.from({ length: 10 }, (_, index) => subscriber(index, index === 0)),
      meta: { page: 1, pageSize: 10, total: 15, totalPages: 2 },
    });
    const html = await render({});
    expect(getAdminUser).toHaveBeenCalledWith("/admin/subscribers");
    expect(fetchWithSession).toHaveBeenCalledWith("/api/admin/subscribers?pageSize=10");
    expect(html).toContain("15 suscriptores");
    expect(html).toContain("persona-0@example.com");
    expect(html).toContain("Canjeado el");
    expect(html).toContain(">Sin canjear</span>");
    expect(html).toContain('href="/api/admin/subscribers/export"');
    expect(html).toContain('aria-label="Paginación"');
  });

  it("asks for the page and search of the URL", async () => {
    vi.mocked(fetchWithSession).mockResolvedValue({ data: [], meta: { page: 2, pageSize: 10, total: 15, totalPages: 2 } });
    await render({ page: "2", search: "persona" });
    expect(fetchWithSession).toHaveBeenCalledWith("/api/admin/subscribers?search=persona&page=2&pageSize=10");
  });

  it("checks the role in the page", async () => {
    vi.mocked(getAdminUser).mockResolvedValue(null);
    expect(await render({})).toContain("Acceso restringido");
    expect(fetchWithSession).not.toHaveBeenCalled();
  });
});
