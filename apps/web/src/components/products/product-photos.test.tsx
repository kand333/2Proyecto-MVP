import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ProductCard } from "@/components/ui/product-card";
import { ProductGallery } from "./product-gallery";
import { ProductImagesManager } from "./product-images-manager";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const photo = (index: number) => ({ id: `img-${index}`, url: `https://res.cloudinary.com/demo/image/upload/v1/terpenex-products/${index}.jpg`, position: index });
const images = [photo(0), photo(1), photo(2)];

describe("product photos", () => {
  // The Cloudinary loader of next.config.ts is tested in lib/image-loader.test.ts (Vitest does not load next.config).
  it("shows the cover in the catalog card", () => {
    const html = renderToStaticMarkup(
      <ProductCard product={{ slug: "a", name: "A", category: "TERPENES", priceFromClp: 990, compareAtFromClp: null, inStock: true, coverUrl: photo(0).url }} />,
    );
    expect(html).toContain("res.cloudinary.com%2Fdemo%2Fimage%2Fupload%2Fv1%2Fterpenex-products%2F0.jpg");
    expect(html).not.toContain("aspect-square items-center justify-center");
  });

  it("shows the 3 photos in the product page, each with alternative text", () => {
    const html = renderToStaticMarkup(<ProductGallery images={images} name="Terpeno Limón" />);
    expect(html).toContain('alt="Terpeno Limón, foto 1 de 3"');
    expect(html.match(/aria-label="Ver foto \d de 3"/g)).toHaveLength(3);
    expect(html).toContain('aria-pressed="true"');
  });

  it("shows the neutral frame when the product has no photos", () => {
    const html = renderToStaticMarkup(<ProductGallery images={[]} name="Sin fotos" />);
    expect(html).toContain("bg-paper");
    expect(html).not.toContain("<img");
  });

  it("lists the photos in the admin with the cover first, delete buttons and the accepted types", () => {
    const html = renderToStaticMarkup(<ProductImagesManager productId="p1" productName="Terpeno Limón" images={images} />);
    expect(html).toContain(">Portada</span>");
    expect(html).toContain('aria-label="Eliminar foto 3"');
    expect(html).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(html).not.toMatch(/<input[^>]*disabled=""/);
  });

  it("disables the upload at 8 photos", () => {
    const eight = Array.from({ length: 8 }, (_, index) => photo(index));
    expect(renderToStaticMarkup(<ProductImagesManager productId="p1" productName="X" images={eight} />)).toMatch(/<input[^>]*disabled=""/);
  });
});
