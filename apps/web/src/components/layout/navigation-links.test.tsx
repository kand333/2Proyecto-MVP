import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCurrentUser } from "@/hooks/use-current-user";
import { HeaderSearch, HeaderSearchForm } from "./header-search";
import { NavigationLinks } from "./navigation-links";
import { SiteFooter } from "./site-footer";
import { SiteNavigation } from "./site-navigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/products/terpeno-limon", useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/hooks/use-current-user", () => ({ useCurrentUser: vi.fn() }));

const asUser = (data: unknown) => vi.mocked(useCurrentUser).mockReturnValue({ data } as ReturnType<typeof useCurrentUser>);

beforeEach(() => asUser(null));

describe("NavigationLinks", () => {
  it("shows Inicio, Catálogo and Contacto, marking the current section", () => {
    const html = renderToStaticMarkup(<NavigationLinks activeHref="/products" orientation="horizontal" />);
    expect([...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1])).toEqual(["/", "/products", "/contact"]);
    expect(html).toMatch(/<a aria-current="page"[^>]*href="\/products"/);
    expect(html).not.toContain("Items");
  });
});

describe("SiteNavigation", () => {
  it("offers search, the login icon and the cart without a session", () => {
    const html = renderToStaticMarkup(<SiteNavigation />);
    expect(html).toContain('aria-label="Buscar"');
    expect(html).toMatch(/href="\/login"[^>]*aria-label="Ingresar"|aria-label="Ingresar"[^>]*href="\/login"/);
    expect(html).toContain('href="/cart"');
    expect(html).toContain('aria-label="Abrir menú"');
    expect(html).not.toContain("Salir");
  });

  it("links a customer to the account with its name, and offers to log out", () => {
    asUser({ id: "u1", name: "Ana Rojas", email: "ana@example.com", role: "USER", isActive: true });
    const html = renderToStaticMarkup(<SiteNavigation />);
    expect(html).toContain('aria-label="Mi cuenta (Ana Rojas)"');
    expect(html).toContain('href="/account"');
    expect(html).toMatch(/<button type="button"[^>]*>Salir<\/button>/);
  });

  it("leads an ADMIN to the administration", () => {
    asUser({ id: "a1", name: "Ada Admin", email: "admin@example.com", role: "ADMIN", isActive: true });
    const html = renderToStaticMarkup(<SiteNavigation />);
    expect(html).toContain('aria-label="Panel administración (Ada Admin)"');
    expect(html).toContain('href="/admin"');
  });
});

describe("header search", () => {
  it("starts closed behind its icon", () => {
    const html = renderToStaticMarkup(<HeaderSearch />);
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("<form");
  });

  it("searches the catalog with a GET form whose field is called like the API parameter", () => {
    const html = renderToStaticMarkup(<HeaderSearchForm />);
    expect(html).toMatch(/^<form [^>]*role="search"/);
    expect(html).toMatch(/^<form [^>]*action="\/products"/);
    expect(html).toMatch(/<input[^>]*type="search"[^>]*name="search"/);
    expect(html).toContain('<label for="header-search-input"');
  });
});

describe("SiteFooter", () => {
  it("shows the full wordmark, the main and legal links and the copyright, without empty social profiles", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(html).toContain("COMPANY");
    expect(html).toContain('href="/contact"');
    for (const slug of ["terms", "privacy", "shipping", "health-warning"]) expect(html).toContain(`href="/legal/${slug}"`);
    expect(html).toMatch(/© (<!-- -->)?\d{4}(<!-- -->)? (<!-- -->)?Terpenex Company/);
    expect(html).not.toContain('aria-label="Instagram"');
    expect(html).not.toContain('aria-label="Facebook"');
  });
});
