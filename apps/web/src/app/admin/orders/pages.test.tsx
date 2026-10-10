import type { AdminOrder } from "@portal/shared/order";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithSession, findWithSession, getAdminUser } from "@/lib/session";
import AdminOrderPage from "./[id]/page";
import AdminOrdersPage from "./page";

vi.mock("@/lib/session", () => ({ getAdminUser: vi.fn(), fetchWithSession: vi.fn(), findWithSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const admin = { id: "a1", name: "Admin", email: "admin@example.com", role: "ADMIN" as const, isActive: true };
const id = "11111111-1111-4111-8111-111111111111";
const order: AdminOrder = {
  id,
  number: 7,
  status: "PAID",
  createdAt: "2026-10-10T15:00:00.000Z",
  email: "ana@example.com",
  name: "Ana Pérez",
  phone: "+56 9 1234 5678",
  hasAccount: false,
  shippingMethod: "DELIVERY",
  address: { region: "VS", commune: "Viña del Mar", street: "Libertad 100", extra: null },
  items: [{ productName: "Jeringa", variantName: "1 unidad", sku: "ACC-1", unitPriceClp: 1490, quantity: 2, lineTotalClp: 2980 }],
  subtotalClp: 2980,
  discountClp: 0,
  shippingClp: 3990,
  totalClp: 6970,
  discountCode: null,
  trackingNumber: null,
  transferInstructions: null,
  pickupAddress: null,
};

const renderList = async (searchParams: Record<string, string>) =>
  renderToStaticMarkup(await AdminOrdersPage({ searchParams: Promise.resolve(searchParams) } as PageProps<"/admin/orders">));
const renderDetail = async (orderId: string) =>
  renderToStaticMarkup(await AdminOrderPage({ params: Promise.resolve({ id: orderId }) } as PageProps<"/admin/orders/[id]">));

beforeEach(() => {
  vi.mocked(getAdminUser).mockReset().mockResolvedValue(admin);
  vi.mocked(fetchWithSession).mockReset().mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });
  vi.mocked(findWithSession).mockReset();
});

describe("/admin/orders", () => {
  it("asks the API with the status and search of the URL", async () => {
    expect(await renderList({ status: "PAID", search: "ana", page: "2" })).toContain(">Pedidos</h1>");
    expect(fetchWithSession).toHaveBeenCalledWith("/api/admin/orders?search=ana&status=PAID&page=2&pageSize=20");
  });

  it("lists each order with its number, status and total linking to the detail", async () => {
    vi.mocked(fetchWithSession).mockResolvedValue({
      data: [{ id, number: 7, status: "PAID", createdAt: order.createdAt, name: "Ana Pérez", email: "ana@example.com", shippingMethod: "DELIVERY", totalClp: 6970 }],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    const html = await renderList({});
    expect(html).toContain(`href="/admin/orders/${id}"`);
    expect(html).toMatch(/N.º (<!-- -->)?7/);
    expect(html).toContain(">Pagado</span>");
    expect(html).toContain("$6.970");
  });

  it("checks the role in every page", async () => {
    vi.mocked(getAdminUser).mockResolvedValue(null);
    expect(await renderList({})).toContain("Acceso restringido");
    expect(await renderDetail(id)).toContain("Acceso restringido");
    expect(fetchWithSession).not.toHaveBeenCalled();
    expect(findWithSession).not.toHaveBeenCalled();
  });

  it("offers only the valid next statuses, with the tracking field to ship", async () => {
    vi.mocked(findWithSession).mockResolvedValue(order);
    const html = await renderDetail(id);
    expect(findWithSession).toHaveBeenCalledWith(`/api/admin/orders/${id}`);
    expect(html).toContain(">Marcar enviado");
    expect(html).toContain(">Marcar entregado");
    expect(html).toContain(">Cancelar pedido");
    expect(html).not.toContain(">Marcar pagado");
    expect(html).toContain('id="tracking-number"');
    expect(html).not.toContain("Paga por transferencia");
    expect(html).toContain("compra como invitado");
  });

  it("shows no actions for a delivered order and 404 for a missing one", async () => {
    vi.mocked(findWithSession).mockResolvedValue({ ...order, status: "DELIVERED" });
    expect(await renderDetail(id)).toContain("ya no admite cambios de estado");
    vi.mocked(findWithSession).mockResolvedValue(null);
    await expect(renderDetail(id)).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(renderDetail("x")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
