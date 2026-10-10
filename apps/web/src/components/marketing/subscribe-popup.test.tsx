import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasSeenSubscribePopup, markSubscribePopupSeen, resetSubscribePopup } from "@/lib/subscribers";
import { FooterSubscribe } from "./footer-subscribe";
import { SubscribeForm, WelcomeCode } from "./subscribe-form";
import { SubscribeDialog, SubscribePopup } from "./subscribe-popup";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("subscription popup", () => {
  it("renders nothing on the server: it opens only in the browser, after the age notice and 10 s", () => {
    expect(renderToStaticMarkup(<SubscribePopup />)).toBe("");
  });

  it("is a labelled dialog with a close button, the email field and the mandatory consent", () => {
    const html = renderToStaticMarkup(<SubscribeDialog onClose={() => undefined} />);
    expect(html).toContain('aria-labelledby="subscribe-title"');
    expect(html).toContain(">10 % en tu primer pedido</h2>");
    expect(html).toContain('aria-label="Cerrar"');
    expect(html).toMatch(/<input[^>]*type="email"[^>]*name="email"/);
    expect(html).toMatch(/<input[^>]*type="checkbox"[^>]*name="marketingConsent"/);
    expect(html).toContain("Quiero mi código");
  });

  it("offers the footer variant with an underline field and an arrow submit", () => {
    const html = renderToStaticMarkup(<SubscribeForm variant="underline" />);
    expect(html).toContain("border-b border-ink");
    expect(html).toMatch(/<button type="submit" aria-label="Suscribirme"/);
  });

  it("shows the code with a copy button once subscribed", () => {
    const html = renderToStaticMarkup(<WelcomeCode code="BIENVENIDA-K7MPQ2" />);
    expect(html).toContain(">BIENVENIDA-K7MPQ2</code>");
    expect(html).toContain("Copiar");
  });
});

describe("popup seen flag", () => {
  beforeEach(() => resetSubscribePopup());
  afterEach(() => vi.unstubAllGlobals());

  it("remembers it in storage, once per browser", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
    expect(hasSeenSubscribePopup()).toBe(false);
    markSubscribePopupSeen();
    resetSubscribePopup();
    expect(hasSeenSubscribePopup()).toBe(true);
  });

  it("remembers it for the page when storage is blocked", () => {
    const blocked = () => {
      throw new Error("blocked");
    };
    vi.stubGlobal("localStorage", { getItem: blocked, setItem: blocked });
    expect(hasSeenSubscribePopup()).toBe(false);
    markSubscribePopupSeen();
    expect(hasSeenSubscribePopup()).toBe(true);
  });
});

describe("footer subscription", () => {
  it("offers the welcome code with the underline field, the mandatory consent and the arrow submit", () => {
    const html = renderToStaticMarkup(<FooterSubscribe />);
    expect(html).toContain(">10 % en tu primer pedido</h2>");
    expect(html).toContain("border-b border-ink");
    expect(html).toMatch(/<input[^>]*type="checkbox"[^>]*name="marketingConsent"/);
    expect(html).toMatch(/<button type="submit" aria-label="Suscribirme"/);
  });
});
