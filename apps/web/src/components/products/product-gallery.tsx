"use client";

import { Leaf } from "@phosphor-icons/react";
import type { ProductImage } from "@portal/shared/product-image";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

/** Gallery of the product page (RF-21): the chosen photo large and the rest as thumbnails. Neutral frame without photos. */
export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = images[selectedIndex] ?? images[0];

  if (!selected) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-paper">
        <Leaf aria-hidden="true" className="size-16 text-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-paper">
        <Image
          src={selected.url}
          alt={images.length > 1 ? `${name}, foto ${selectedIndex + 1} de ${images.length}` : name}
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Ver foto ${index + 1} de ${images.length}`}
                aria-pressed={index === selectedIndex}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-sm border-2 transition-colors duration-200",
                  index === selectedIndex ? "border-ink" : "border-transparent hover:border-line",
                )}
              >
                <Image src={image.url} alt="" fill sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
