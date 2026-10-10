import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseAmount } from "@/lib/settings";
import { fetchWithSession, getAdminUser } from "@/lib/session";
import AdminSettingsPage from "./page";

vi.mock("@/lib/session", () => ({ getAdminUser: vi.fn(), fetchWithSession: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const admin = { id: "a1", name: "Admin", email: "admin@example.com", role: "ADMIN" as const, isActive: true };
const settings = { flatShippingClp: 3990, freeShippingFromClp: null, pickupAddress: "Av. Providencia 1234", transferInstructions: "Banco X" };

beforeEach(() => {
  vi.mocked(getAdminUser).mockReset().mockResolvedValue(admin);
  vi.mocked(fetchWithSession).mockReset().mockResolvedValue(settings);
});

describe("/admin/settings", () => {
  it("checks the role in the page and loads the current settings into the form", async () => {
    const html = renderToStaticMarkup(await AdminSettingsPage());
    expect(getAdminUser).toHaveBeenCalledWith("/admin/settings");
    expect(fetchWithSession).toHaveBeenCalledWith("/api/admin/settings");
    expect(html).toContain(">Ajustes de tienda</h1>");
    expect(html).toMatch(/name="flatShippingClp"[^>]*value="3990"/);
    expect(html).toMatch(/name="freeShippingFromClp"[^>]*value=""/);
    expect(html).toMatch(/name="pickupAddress"[^>]*value="Av. Providencia 1234"/);
    expect(html).toContain(">Banco X</textarea>");
  });

  it("answers access denied without loading anything for a non admin", async () => {
    vi.mocked(getAdminUser).mockResolvedValue(null);
    expect(renderToStaticMarkup(await AdminSettingsPage())).toContain("Acceso restringido");
    expect(fetchWithSession).not.toHaveBeenCalled();
  });
});

describe("parseAmount", () => {
  it.each([
    ["3990", 3990],
    ["$3.990", 3990],
    [" 49 990 ", 49990],
    ["", undefined],
    ["abc", Number.NaN],
  ])("%s → %s", (text, amount) => {
    expect(parseAmount(text)).toEqual(amount);
  });
});
