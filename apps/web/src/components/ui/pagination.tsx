import Link from "next/link";
import { cn } from "@/lib/cn";
import { buildPageHref, buildPaginationItems } from "@/lib/pagination";

type PaginationProps = {
  pathname: string;
  searchParams: URLSearchParams;
  currentPage: number;
  totalPages: number;
};

const itemClassName =
  "inline-flex h-11 min-w-11 items-center justify-center rounded-lg border px-4 text-sm font-medium tabular-nums transition-colors duration-200";
const linkClassName =
  "border-line text-ink hover:border-accent hover:bg-surface";
const disabledClassName = "border-line/60 text-muted/50";

/** Page links that keep the rest of the query string. Renders nothing when there is a single page. */
export function Pagination({ pathname, searchParams, currentPage, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hrefFor = (page: number) => buildPageHref(pathname, searchParams, page);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav aria-label="Paginación" className="mt-14">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          {hasPrevious ? (
            // Beyond the last page, going back lands on the last page that exists.
            <Link href={hrefFor(Math.min(currentPage - 1, totalPages))} rel="prev" className={cn(itemClassName, linkClassName)}>
              Anterior
            </Link>
          ) : (
            <span aria-disabled="true" className={cn(itemClassName, disabledClassName)}>
              Anterior
            </span>
          )}
        </li>
        {buildPaginationItems(currentPage, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <li key={`ellipsis-${index}`} aria-hidden="true" className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={hrefFor(item)}
                aria-label={`Página ${item}`}
                aria-current={item === currentPage ? "page" : undefined}
                className={cn(
                  itemClassName,
                  item === currentPage ? "border-accent bg-accent text-on-accent" : linkClassName,
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
        <li>
          {hasNext ? (
            <Link href={hrefFor(currentPage + 1)} rel="next" className={cn(itemClassName, linkClassName)}>
              Siguiente
            </Link>
          ) : (
            <span aria-disabled="true" className={cn(itemClassName, disabledClassName)}>
              Siguiente
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
