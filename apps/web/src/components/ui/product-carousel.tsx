"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { PublicProductSummary } from "@portal/shared/product";
import { useRef } from "react";
import { IconButton } from "./icon-button";
import { ProductCard } from "./product-card";

type ProductCarouselProps = {
  products: PublicProductSummary[];
  /** Accessible name of the region, e.g. the section title. */
  label: string;
};

/**
 * Horizontal row of ProductCards with scroll snap (docs/design.md): native scrolling and keyboard
 * focus through the cards; the arrows move one visible page. The page's reduced-motion rule
 * turns the smooth scroll off.
 */
export function ProductCarousel({ products, label }: ProductCarouselProps) {
  const listRef = useRef<HTMLUListElement>(null);

  function scrollPage(direction: 1 | -1) {
    const list = listRef.current;
    if (!list) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollBy({ left: direction * list.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }

  return (
    <section aria-label={label} aria-roledescription="carrusel" className="relative">
      <div className="mb-3 flex justify-end gap-1">
        <IconButton label="Productos anteriores" icon={<CaretLeft />} onClick={() => scrollPage(-1)} />
        <IconButton label="Productos siguientes" icon={<CaretRight />} onClick={() => scrollPage(1)} />
      </div>
      <ul
        ref={listRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <li key={product.slug} className="w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-[calc((100%-5rem)/6)]">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
