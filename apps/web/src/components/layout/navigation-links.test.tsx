import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NavigationLinks } from "./navigation-links";

describe("NavigationLinks", () => {
  it("links to the login page without a session", () => {
    const html = renderToStaticMarkup(<NavigationLinks activeHref="/" orientation="horizontal" />);
    expect(html).toContain('href="/login"');
    expect(html).not.toContain("Salir");
  });

  it("shows the user's name and a logout button instead of «Ingresar» with a session", () => {
    const html = renderToStaticMarkup(
      <NavigationLinks activeHref="/" orientation="horizontal" userName="Ana Rojas" onLogout={() => undefined} />,
    );
    expect(html).not.toContain('href="/login"');
    expect(html).toMatch(/<a [^>]*href="\/account"[^>]*>Ana Rojas<\/a>/);
    expect(html).toContain('aria-label="Mi cuenta (Ana Rojas)"');
    expect(html).toMatch(/<button type="button"[^>]*>Salir<\/button>/);
    // The other links stay.
    expect(html).toContain('href="/items"');
  });

  it("leads an ADMIN from its name to «Panel administración»", () => {
    const html = renderToStaticMarkup(
      <NavigationLinks activeHref="/" orientation="horizontal" userName="Ada Admin" isAdmin onLogout={() => undefined} />,
    );
    expect(html).toMatch(/<a [^>]*href="\/admin"[^>]*>Ada Admin<\/a>/);
    expect(html).toContain('aria-label="Panel administración (Ada Admin)"');
    expect(html).not.toContain('href="/account"');
  });
});
