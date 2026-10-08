import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

const request = (tone?: "danger") => ({
  title: "¿Eliminar a Ana?",
  message: "Se borra su cuenta para siempre.",
  confirmLabel: "Eliminar",
  tone,
  resolve: vi.fn(),
});

describe("ConfirmDialog", () => {
  it("is an accessible modal dialog with the warning, «Cancelar» first", () => {
    const html = renderToStaticMarkup(<ConfirmDialog request={request("danger")} onClose={vi.fn()} />);
    expect(html).toMatch(/^<dialog aria-labelledby="[^"]+" aria-describedby="[^"]+"/);
    expect(html).toContain(">¿Eliminar a Ana?</h2>");
    expect(html).toContain("Se borra su cuenta para siempre.");
    expect(html.indexOf(">Cancelar<")).toBeLessThan(html.indexOf(">Eliminar<"));
    expect(html).toContain("bg-red-700");
  });

  it("uses the regular button for non-dangerous confirmations, and renders nothing inside when idle", () => {
    expect(renderToStaticMarkup(<ConfirmDialog request={request()} onClose={vi.fn()} />)).toContain("bg-accent");
    expect(renderToStaticMarkup(<ConfirmDialog request={null} onClose={vi.fn()} />)).not.toContain("<h2");
  });
});
