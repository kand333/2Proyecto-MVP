import type { OrderView } from "@portal/shared/order";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithSession, findWithSession, requireCustomerUser } from "@/lib/session";
import AccountOrderPage from "./[id]/page";
import AccountOrdersPage from "./page";

vi.mock("@/lib/session", () => ({ requireCustomerUser: vi.fn(), fetchWithSession: vi.fn(), findWithSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const user = { id: "u1", name: "Ana", email: "ana@example.com", role: "USER" as const, isActive: true };
const id = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.mocked(requireCustomerUser).mockReset().mockResolvedValue(user);
  vi.mocked(fetchWithSession).mockReset();
  vi.mocked(findWithSession).mockReset();
});

describe("/account/orders", () => {
  it("checks the customer in the page (an ADMIN goes to the admin orders) and lists both orders", async () => {
    vi.mocked(fetchWithSession).mockResolvedValue([
      { id, number: 12, status: "SHIPPED", createdAt: "2026-10-10T15:00:00.000Z", totalClp: 20172, itemCount: 3 },
      { id: "22222222-2222-4222-8222-222222222222", number: 9, status: "PENDING_PAYMENT", createdAt: "2026-10-09T15:00:00.000Z", totalClp: 4990, itemCount: 1 },
    ]);
    const html = renderToStaticMarkup(await AccountOrdersPage());
    expect(requireCustomerUser).toHaveBeenCalledWith("/account/orders", "/admin/orders");
    expect(fetchWithSession).toHaveBeenCalledWith("/api/account/orders");
    expect(html).toMatch(/Pedido N.º (<!-- -->)?12/);
    expect(html).toMatch(/Pedido N.º (<!-- -->)?9/);
    expect(html).toContain(`href="/account/orders/${id}"`);
    expect(html).toContain(">Enviado</span>");
  });

  it("invites to the catalog without orders", async () => {
    vi.mocked(fetchWithSession).mockResolvedValue([]);
    expect(renderToStaticMarkup(await AccountOrdersPage())).toContain("Aún no tienes pedidos");
  });

  it("shows an own order and 404 for a missing or foreign one", async () => {
    const order = { number: 12, status: "PAID", createdAt: "2026-10-10T15:00:00.000Z", items: [], address: null, shippingMethod: "PICKUP" } as unknown as OrderView;
    vi.mocked(findWithSession).mockResolvedValue({ ...order, email: "ana@example.com", name: "Ana", subtotalClp: 0, discountClp: 0, shippingClp: 0, totalClp: 0 });
    const html = renderToStaticMarkup(await AccountOrderPage({ params: Promise.resolve({ id }) } as PageProps<"/account/orders/[id]">));
    expect(findWithSession).toHaveBeenCalledWith(`/api/account/orders/${id}`);
    expect(html).toContain(">Pagado</span>");
    vi.mocked(findWithSession).mockResolvedValue(null);
    await expect(AccountOrderPage({ params: Promise.resolve({ id }) } as PageProps<"/account/orders/[id]">)).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
