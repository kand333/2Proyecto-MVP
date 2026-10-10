import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ArrowRight, MagnifyingGlass, ShoppingBag } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";
import { Button, buttonClassName } from "./button";
import { EmptyState } from "./empty-state";
import { Field, Input, Select } from "./field";
import { IconButton, IconCount, iconButtonClassName } from "./icon-button";
import { Price } from "./price";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { ProductCarousel } from "./product-carousel";
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

  it.each(uiSources)("$file never types an arrow or a dash as decoration", ({ source }) => {
    expect(source).not.toMatch(/[→—–]/);
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
    expect(renderToStaticMarkup(<Button variant="secondary">Cancelar</Button>)).toContain("border-ink");
    expect(buttonClassName("ghost", "sm")).toContain("h-9");
    expect(buttonClassName()).toContain("rounded-sm");
  });

  it("adds a decorative icon after the label, hidden while loading", () => {
    const html = renderToStaticMarkup(<Button iconEnd={<ArrowRight />}>Explorar</Button>);
    expect(html).toMatch(/Explorar<span aria-hidden="true"[^>]*><svg/);
    expect(renderToStaticMarkup(<Button loading iconEnd={<ArrowRight />}>Explorar</Button>).match(/<svg/g)).toHaveLength(1);
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

describe("IconButton", () => {
  it("is a 44 px non-submitting button named by its label", () => {
    const html = renderToStaticMarkup(<IconButton label="Buscar" icon={<MagnifyingGlass />} />);
    expect(html).toMatch(/^<button type="button" aria-label="Buscar"/);
    expect(html).toContain("size-11");
    expect(html).toMatch(/<svg/);
  });

  it("offers the classes for links and a decorative count", () => {
    const html = renderToStaticMarkup(
      <a href="/cart" aria-label="Carrito, 3 unidades" className={iconButtonClassName()}>
        <ShoppingBag aria-hidden="true" />
        <IconCount count={3} />
      </a>,
    );
    expect(html).toContain("size-11");
    expect(html).toMatch(/<span aria-hidden="true"[^>]*>3<\/span>/);
    expect(renderToStaticMarkup(<IconCount count={120} />)).toContain(">99+</span>");
  });
});

describe("Input underline", () => {
  it("draws only a bottom rule and keeps the field accessible", () => {
    const html = renderToStaticMarkup(
      <Field id="subscribe-email" label="Email">{(control) => <Input variant="underline" type="email" {...control} />}</Field>,
    );
    expect(html).toContain("border-b border-ink");
    expect(html).not.toContain("rounded-sm border border-line");
    expect(html).toContain("<label for=\"subscribe-email\"");
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

  it("renders the offer and sold-out pills as solid tokens", () => {
    expect(renderToStaticMarkup(<Badge tone="offer">Oferta</Badge>)).toContain("bg-highlight text-on-highlight");
    expect(renderToStaticMarkup(<Badge tone="soldOut">Agotado</Badge>)).toContain("bg-ink text-paper");
  });

  it("strikes the previous price through, announced as such", () => {
    const html = renderToStaticMarkup(<Price amountClp={9990} compareAtClp={12990} />);
    expect(html).toContain("<s class=\"ml-2 font-normal text-muted\"><span class=\"sr-only\">Precio anterior </span>$12.990</s>");
    expect(renderToStaticMarkup(<Price amountClp={9990} compareAtClp={null} />)).not.toContain("<s ");
  });

  it("formats CLP with tabular figures and an optional «Desde»", () => {
    expect(renderToStaticMarkup(<Price amountClp={12990} />)).toBe(
      '<span class="tabular-nums"><data value="12990">$12.990</data></span>',
    );
    expect(renderToStaticMarkup(<Price amountClp={4990} from />)).toContain("Desde </span>");
  });
});

describe("ProductCard", () => {
  const product = { slug: "terpeno-limon", name: "Terpeno limón", category: "TERPENES" as const, priceFromClp: 12990, compareAtFromClp: null, inStock: true, coverUrl: null };

  it("links to the product page with a 1:1 photo, the name in accent and the price", () => {
    const html = renderToStaticMarkup(<ProductCard product={product} />);
    expect(html).toContain('href="/products/terpeno-limon"');
    expect(html).toMatch(/<h3 class="[^"]*text-accent[^"]*">Terpeno limón<\/h3>/);
    expect(html).toContain("$12.990");
    expect(html).toContain("aspect-square");
    expect(html).not.toContain("Agotado");
    expect(html).not.toContain("Oferta");
  });

  it("marks an offer with its previous price, and a sold-out product only as sold out", () => {
    const offer = renderToStaticMarkup(<ProductCard product={{ ...product, priceFromClp: 9990, compareAtFromClp: 12990 }} />);
    expect(offer).toContain(">Oferta</span>");
    expect(offer).toContain("Precio anterior </span>$12.990</s>");
    const soldOutOffer = renderToStaticMarkup(<ProductCard product={{ ...product, compareAtFromClp: 15990, inStock: false }} />);
    expect(soldOutOffer).toContain(">Agotado</span>");
    expect(soldOutOffer).not.toContain(">Oferta</span>");
  });

  it("has a hidden skeleton with the same shape", () => {
    const html = renderToStaticMarkup(<ProductCardSkeleton />);
    expect(html).toMatch(/^<div aria-hidden="true"/);
    expect(html).toContain("aspect-square");
  });
});

describe("ProductCarousel", () => {
  it("is a named region of scroll-snapped cards with named arrows", () => {
    const products = [
      { slug: "a", name: "A", category: "TERPENES" as const, priceFromClp: 990, compareAtFromClp: null, inStock: true, coverUrl: null },
      { slug: "b", name: "B", category: "VAPES" as const, priceFromClp: 1990, compareAtFromClp: null, inStock: true, coverUrl: null },
    ];
    const html = renderToStaticMarkup(<ProductCarousel products={products} label="Colección destacada" />);
    expect(html).toContain('aria-label="Colección destacada"');
    expect(html).toContain('aria-label="Productos anteriores"');
    expect(html).toContain('aria-label="Productos siguientes"');
    expect(html).toContain("snap-x snap-mandatory");
    expect(html.match(/snap-start/g)).toHaveLength(2);
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
        action={<Link href="/products">Ver todo el catálogo</Link>}
      />,
    );
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(html).toContain(">Sin resultados</h2>");
    expect(html).toContain("Prueba con otra búsqueda.");
    expect(html).toContain('href="/products"');
  });
});
