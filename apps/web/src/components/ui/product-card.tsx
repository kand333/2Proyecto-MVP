import { Leaf } from "@phosphor-icons/react/ssr";
import { PRODUCT_CATEGORY_LABELS, type PublicProductSummary } from "@portal/shared/product";
import Link from "next/link";
import { Badge } from "./badge";
import { Price } from "./price";
import { Skeleton } from "./skeleton";

/** Neutral 4:5 frame used while a product has no photo (photos arrive with RF-21). */
function ImagePlaceholder() {
  return (
    <div className="flex aspect-[4/5] items-center justify-center rounded-lg bg-paper">
      <Leaf aria-hidden="true" className="size-10 text-muted" />
    </div>
  );
}

/** A product of the catalog grid: the whole card links to its page. */
export function ProductCard({ product }: { product: PublicProductSummary }) {
  return (
    <article className="h-full">
      <Link
        href={`/products/${product.slug}`}
        className="group flex h-full flex-col gap-3 rounded-xl border border-line bg-surface p-3 shadow-soft transition-[border-color,box-shadow] duration-200 hover:border-accent/60 hover:shadow-lift"
      >
        <ImagePlaceholder />
        <div className="flex min-w-0 flex-1 flex-col gap-1 px-1 pb-1">
          <p className="text-xs text-muted">{PRODUCT_CATEGORY_LABELS[product.category]}</p>
          <h3 className="line-clamp-2 break-words font-semibold text-ink group-hover:text-accent">{product.name}</h3>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
            <Price amountClp={product.priceFromClp} from className="font-semibold text-ink" />
            {!product.inStock && <Badge tone="danger">Agotado</Badge>}
          </div>
        </div>
      </Link>
    </article>
  );
}

/** Loading shape of a ProductCard, for skeleton grids. */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3">
      <Skeleton className="aspect-[4/5]" />
      <div className="flex flex-col gap-2 px-1 pb-1">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-1 h-4 w-1/2" />
      </div>
    </div>
  );
}
