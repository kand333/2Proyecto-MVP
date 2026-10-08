import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AccountOverview } from "./account-overview";

const user = { id: "u1", name: "Ana García", email: "ana@test.com", role: "USER" as const, isActive: true };

describe("AccountOverview", () => {
  it("shows the basic information of the user", () => {
    const html = renderToStaticMarkup(<AccountOverview user={user} />);
    expect(html).toMatch(/<h1[^>]*>Mi cuenta<\/h1>/);
    expect(html).toContain("<dt class=\"text-sm text-muted\">Nombre</dt>");
    expect(html).toContain("Ana García");
    expect(html).toContain("ana@test.com");
    expect(html).toContain(">Usuario</dd>");
  });

  it("links to the independent edit page", () => {
    expect(renderToStaticMarkup(<AccountOverview user={user} />)).toMatch(/href="\/account\/edit"[^>]*>Editar cuenta<\/a>/);
  });

  it("has no link to the administration (an ADMIN never reaches this page)", () => {
    expect(renderToStaticMarkup(<AccountOverview user={user} />)).not.toContain('href="/admin"');
  });
});
