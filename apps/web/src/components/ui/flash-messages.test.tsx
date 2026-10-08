import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FlashItem, FlashMessages } from "./flash-messages";

describe("FlashMessages", () => {
  it("keeps an announced, fixed region at the top of the page", () => {
    const html = renderToStaticMarkup(<FlashMessages />);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-label="Avisos"');
    expect(html).toMatch(/class="[^"]*fixed[^"]*top-3/);
  });

  it("shows each notice with its tone and a close button", () => {
    const html = renderToStaticMarkup(<FlashItem message={{ id: "1", tone: "success", text: "Cuenta de Ana creada." }} />);
    expect(html).toContain(">Cuenta de Ana creada.</p>");
    expect(html).toContain('aria-label="Cerrar aviso"');
    expect(html).toContain("bg-emerald-600");
  });

  it("marks errors apart", () => {
    const html = renderToStaticMarkup(<FlashItem message={{ id: "2", tone: "error", text: "No pudimos cerrar la sesión." }} />);
    expect(html).toContain("bg-red-600");
  });
});
