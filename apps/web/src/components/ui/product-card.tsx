import { Leaf } from "@phosphor-icons/react/ssr";
import type { PublicProductSummary } from "@portal/shared/product";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "./badge";
import { Price } from "./price";
import { Skeleton } from "./skeleton";

/** Neutral 1:1 frame for a product without photos (RF-21). */
function ImagePlaceholder() {
  return (
    <div className="flex aspect-square items-center justify-center rounded-lg bg-paper transition-transform duration-200 group-hover:scale-[1.02]">
      <Leaf aria-hidden="true" className="size-10 text-muted" />
    </div>
  );
}

/** "Agotado" replaces "Oferta": only one status over the photo (DEC-017). */
function statusOf({ inStock, compareAtFromClp }: PublicProductSummary) {
  if (!inStock) return <Badge tone="soldOut">Agotado</Badge>;
  if (compareAtFromClp !== null) return <Badge tone="offer">Oferta</Badge>;
  return null;
}

/**
 * A product of the catalog grid and the featured carousel (docs/design.md): no border, 1:1 photo
 * with its status, name in accent and price with the previous one if on offer. The whole card links.
 */
export function ProductCard({ product }: { product: PublicProductSummary }) {
  const status = statusOf(product);
  return (
    <article className="h-full">
      <Link href={`/products/${product.slug}`} className="group flex h-full flex-col gap-3 rounded-lg">
        <div className="relative overflow-hidden rounded-lg">
          {product.coverUrl ? (
            <div className="relative aspect-square overflow-hidden rounded-lg bg-paper">
              <Image
                src={product.coverUrl}
                alt=""
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </div>
          ) : (
            <ImagePlaceholder />
          )}
          {status && <div className="absolute left-2 top-2">{status}</div>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="line-clamp-2 break-words text-sm text-accent group-hover:underline">{product.name}</h3>
          <Price amountClp={product.priceFromClp} compareAtClp={product.compareAtFromClp} className="text-sm font-semibold text-ink" />
        </div>
      </Link>
    </article>
  );
}

/** Loading shape of a ProductCard, for skeleton grids. */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      <Skeleton className="aspect-square rounded-lg" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
