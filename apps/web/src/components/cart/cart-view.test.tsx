import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HeaderCartLink } from "@/components/layout/header-cart-link";
import { CartView } from "./cart-view";

// The server render has no cart (localStorage only exists in the browser): both start empty.
describe("cart on the server render", () => {
  it("shows the empty cart with a link to the catalog", () => {
    const html = renderToStaticMarkup(<CartView />);
    expect(html).toContain("Tu carrito está vacío");
    expect(html).toContain('href="/products"');
  });

  it("shows the header cart icon without a count", () => {
    const html = renderToStaticMarkup(<HeaderCartLink />);
    expect(html).toContain('href="/cart"');
    expect(html).toContain('aria-label="Carrito"');
    expect(html).not.toMatch(/<span aria-hidden="true"[^>]*>\d/);
  });
});
