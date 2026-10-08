import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminDashboard } from "./admin-dashboard";

const stats = { users: 42, items: { total: 1250, published: 1200 } };

describe("AdminDashboard", () => {
  it("shows the indicators with the site number format", () => {
    const html = renderToStaticMarkup(<AdminDashboard stats={stats} />);
    for (const [label, value] of [
      ["Total", "1.250"],
      ["Publicados", "1.200"],
      ["Usuarios", "42"],
    ]) {
      expect(html, label).toMatch(new RegExp(`<dt[^>]*>${label}</dt><dd[^>]*>${value.replace(".", "\.")}</dd>`));
    }
  });

  it("links to the item and user management", () => {
    const html = renderToStaticMarkup(<AdminDashboard stats={stats} />);
    expect(html).toContain('href="/admin/items"');
    expect(html).toContain('href="/admin/users"');
  });

  it("tells how many items are not published", () => {
    expect(renderToStaticMarkup(<AdminDashboard stats={stats} />)).toContain("50 sin publicar");
    const one = { ...stats, items: { total: 1250, published: 1249 } };
    expect(renderToStaticMarkup(<AdminDashboard stats={one} />)).toContain("1 sin publicar");
  });
});
