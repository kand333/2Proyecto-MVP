import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MagnifyingGlass } from "@phosphor-icons/react/ssr";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";
import { Button, buttonClassName } from "./button";
import { EmptyState } from "./empty-state";
import { Field, Input, Select } from "./field";
import { Price } from "./price";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { Skeleton } from "./skeleton";

const uiDirectory = join(process.cwd(), "src/components/ui");
const uiSources = readdirSync(uiDirectory)
  .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"))
  .map((file) => ({ file, source: readFileSync(join(uiDirectory, file), "utf8") }));

describe("components/ui", () => {
  it.each(uiSources)("$file uses only the design tokens (red and emerald only for states)", ({ source }) => {
    // Tailwind palette colors other than red/emerald, black/white, and raw hex/rgb colors in classes.
    const palette =
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|divide|placeholder|shadow|accent|caret)-(?:slate|gray|zinc|neutral|stone|orange|amber|yellow|lime|green|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)\b/;
    expect(source).not.toMatch(palette);
    expect(source).not.toMatch(/-\[(?:#|rgb|hsl|oklch)/);
  });

  it.each(uiSources)("$file draws no icon by hand and never hides the focus outline", ({ source }) => {
    expect(source).not.toContain("<svg");
    expect(source).not.toMatch(/outline-none|outline-0/);
  });
});

describe("Button", () => {
  it("is a non-submitting button with the primary look by default", () => {
    const html = renderToStaticMarkup(<Button>Guardar</Button>);
    expect(html).toMatch(/^<button type="button"/);
    expect(html).toContain("bg-accent text-on-accent");
    expect(html).toContain(">Guardar</button>");
  });

  it("shows disabled buttons as such", () => {
    const html = renderToStaticMarkup(<Button disabled>Guardar</Button>);
    expect(html).toContain('disabled=""');
    expect(html).toContain("disabled:opacity-60");
    expect(html).toContain("disabled:cursor-not-allowed");
  });

  it("disables itself and shows a hidden spinner and the loading label while loading", () => {
    const html = renderToStaticMarkup(
      <Button type="submit" loading loadingLabel="Guardando…">
        Guardar
      </Button>,
    );
    expect(html).toContain('type="submit"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"[^>]*animate-spin|<svg[^>]*animate-spin[^>]*aria-hidden="true"/);
    expect(html).toContain("Guardando…</button>");
    expect(html).not.toContain(">Guardar<");
  });

  it("offers each variant and the classes for links that look like buttons", () => {
    expect(renderToStaticMarkup(<Button variant="danger">Eliminar</Button>)).toContain("bg-red-700");
    expect(renderToStaticMarkup(<Button variant="secondary">Cancelar</Button>)).toContain("border-line");
    expect(buttonClassName("ghost", "sm")).toContain("h-9");
    expect(buttonClassName()).toContain("rounded-lg");
  });
});

describe("Field", () => {
  it("labels the control and links its help and error", () => {
    const html = renderToStaticMarkup(
      <Field id="email" label="Email" hint="Te enviaremos el pedido aquí." error="Ingresa un email válido">
        {(control) => <Input type="email" name="email" autoComplete="email" {...control} />}
      </Field>,
    );
    expect(html).toContain('<label for="email"');
    expect(html).toContain(">Email</label>");
    expect(html).toContain('id="email-hint"');
    expect(html).toContain('id="email-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="email-hint email-error"');
    expect(html.indexOf("email-hint")).toBeLessThan(html.indexOf("<input"));
    expect(html.indexOf("<input")).toBeLessThan(html.indexOf('id="email-error"'));
  });

  it("leaves a valid control without error attributes", () => {
    const html = renderToStaticMarkup(<Field id="name" label="Nombre">{(control) => <Input {...control} />}</Field>);
    expect(html).not.toContain("aria-invalid=");
    expect(html).not.toContain("aria-describedby=");
  });
});

describe("Select", () => {
  it("is a native select with explicit colors and a decorative caret", () => {
    const html = renderToStaticMarkup(
      <Field id="region" label="Región">
        {(control) => (
          <Select name="region" {...control}>
            <option value="RM">Metropolitana</option>
          </Select>
        )}
      </Field>,
    );
    expect(html).toMatch(/<select class="[^"]*bg-surface[^"]*text-ink[^"]*" name="region" id="region"/);
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  });
});

describe("Badge and Price", () => {
  it("renders a pill badge with its tone", () => {
    const html = renderToStaticMarkup(<Badge tone="danger">Agotado</Badge>);
    expect(html).toContain("rounded-full");
    expect(html).toContain("text-red-800");
    expect(html).toContain(">Agotado</span>");
  });

  it("formats CLP with tabular figures and an optional «Desde»", () => {
    expect(renderToStaticMarkup(<Price amountClp={12990} />)).toBe(
      '<span class="tabular-nums"><data value="12990">$12.990</data></span>',
    );
    expect(renderToStaticMarkup(<Price amountClp={4990} from />)).toContain("Desde </span>");
  });
});

describe("ProductCard", () => {
  const product = { slug: "terpeno-limon", name: "Terpeno limón", category: "TERPENES" as const, priceFromClp: 12990, inStock: true };

  it("links to the product page, named by the product, with category and price", () => {
    const html = renderToStaticMarkup(<ProductCard product={product} />);
    expect(html).toContain('href="/products/terpeno-limon"');
    expect(html).toContain(">Terpeno limón</h3>");
    expect(html).toContain(">Terpenos</p>");
    expect(html).toContain("$12.990");
    expect(html).toContain("aspect-[4/5]");
    expect(html).not.toContain("Agotado");
  });

  it("marks a product without stock as sold out", () => {
    expect(renderToStaticMarkup(<ProductCard product={{ ...product, inStock: false }} />)).toContain(">Agotado</span>");
  });

  it("has a hidden skeleton with the same shape", () => {
    const html = renderToStaticMarkup(<ProductCardSkeleton />);
    expect(html).toMatch(/^<div aria-hidden="true"/);
    expect(html).toContain("aspect-[4/5]");
  });
});

describe("Skeleton and EmptyState", () => {
  it("hides the skeleton from screen readers", () => {
    expect(renderToStaticMarkup(<Skeleton className="h-4" />)).toMatch(/^<div aria-hidden="true" class="[^"]*animate-pulse[^"]*h-4/);
  });

  it("explains the empty state and offers the next step", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        icon={MagnifyingGlass}
        title="Sin resultados"
        description="Prueba con otra búsqueda."
        action={<a href="/products">Ver todo el catálogo</a>}
      />,
    );
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(html).toContain(">Sin resultados</h2>");
    expect(html).toContain("Prueba con otra búsqueda.");
    expect(html).toContain('href="/products"');
  });
});
