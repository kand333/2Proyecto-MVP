import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { siteConfig } from "@/lib/site-config";

vi.mock("./site-navigation", () => ({ SiteNavigation: () => null }));

import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("shows the store name linking to the home page", () => {
    const html = renderToStaticMarkup(<SiteHeader />);

    expect(siteConfig.name).toBe("Terpenos & Vapes");
    expect(html).toContain("Terpenos &amp; Vapes");
    expect(html).toContain('href="/"');
  });
});
