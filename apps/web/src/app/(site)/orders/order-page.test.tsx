import type { OrderView } from "@portal/shared/order";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchOrderByToken } from "@/lib/public-orders-api";
import OrderPage from "./[token]/page";

vi.mock("@/lib/public-orders-api", () => ({ fetchOrderByToken: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const order: OrderView = {
  number: 1042,
  status: "PENDING_PAYMENT",
  createdAt: "2026-10-10T15:00:00.000Z",
  email: "ana@example.com",
  name: "Ana Pérez",
  shippingMethod: "DELIVERY",
  address: { region: "RM", commune: "Providencia", street: "Av. Providencia 1234", extra: "Depto 5" },
  items: [{ productName: "Terpeno Limón", variantName: "1 ml", sku: "TER-LIM-1", unitPriceClp: 8990, quantity: 2, lineTotalClp: 17980 }],
  subtotalClp: 17980,
  discountClp: 1798,
  shippingClp: 3990,
  totalClp: 20172,
  discountCode: "BIENVENIDA-K7MPQ2",
  trackingNumber: null,
  transferInstructions: "Banco Ejemplo\nCuenta corriente 123",
  pickupAddress: null,
};

const render = async (token: string) => renderToStaticMarkup(await OrderPage({ params: Promise.resolve({ token }) } as PageProps<"/orders/[token]">));

beforeEach(() => vi.mocked(fetchOrderByToken).mockReset());

describe("/orders/[token]", () => {
  it("shows the number, status, transfer instructions, totals, address and the notice to keep the link", async () => {
    vi.mocked(fetchOrderByToken).mockResolvedValue(order);
    const html = await render("x".repeat(43));
    expect(html).toMatch(/Pedido N.º (<!-- -->)?1042/);
    expect(html).toContain(">Pendiente de pago</span>");
    expect(html).toContain("Banco Ejemplo\nCuenta corriente 123");
    expect(html).toContain("$20.172");
    expect(html).toContain("Descuento (BIENVENIDA-K7MPQ2)");
    expect(html).toContain("Metropolitana de Santiago");
    expect(html).toContain("Guarda este enlace");
  });

  it("hides the payment block once paid and shows the tracking number", async () => {
    vi.mocked(fetchOrderByToken).mockResolvedValue({ ...order, status: "SHIPPED", transferInstructions: null, trackingNumber: "CX123" });
    const html = await render("x".repeat(43));
    expect(html).not.toContain("Paga por transferencia");
    expect(html).toContain(">CX123</strong>");
  });

  it("answers 404 for an unknown token", async () => {
    vi.mocked(fetchOrderByToken).mockResolvedValue(null);
    await expect(render("nada")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
