import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SiteFooter } from "@/components/layout/site-footer";
import LegalPage, { generateStaticParams } from "./[slug]/page";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const render = async (slug: string) => renderToStaticMarkup(await LegalPage({ params: Promise.resolve({ slug }) } as PageProps<"/legal/[slug]">));

describe("legal pages", () => {
  it("builds the four pages, each marked as a draft pending legal review", async () => {
    expect(generateStaticParams().map(({ slug }) => slug).sort()).toEqual(["health-warning", "privacy", "shipping", "terms"]);
    for (const { slug } of generateStaticParams()) {
      expect(await render(slug)).toContain("Borrador pendiente de revisión legal");
    }
    expect(await render("health-warning")).toContain("altamente adictiva");
  });

  it("answers 404 for an unknown page", async () => {
    await expect(render("cookies")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("links the four pages from the footer of every public page", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    for (const slug of ["terms", "privacy", "shipping", "health-warning"]) expect(html).toContain(`href="/legal/${slug}"`);
  });
});
