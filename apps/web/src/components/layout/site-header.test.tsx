import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { siteConfig } from "@/lib/site-config";

vi.mock("./site-navigation", () => ({ SiteNavigation: () => null }));

import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("shows the wordmark linking to the home page with the store name", () => {
    const html = renderToStaticMarkup(<SiteHeader />);

    expect(siteConfig.name).toBe("Terpenex Company");
    expect(html).toContain('aria-label="Terpenex Company, inicio"');
    expect(html).toContain('href="/"');
    expect(html).toContain('<span class="text-accent">TERPENE</span><span class="text-highlight">X</span>');
  });
});
