export type PaginationItem = number | "ellipsis";

/** Reads the `page` query parameter; anything that is not a positive integer means page 1. */
export function parsePageParam(value: string | null): number {
  if (value === null || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

/**
 * Page numbers to display: all of them when they are few, otherwise the first,
 * the last and the neighbours of the current page, with ellipses in between.
 */
export function buildPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sortedPages = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);

  const items: PaginationItem[] = [];
  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];
    if (previousPage !== undefined && page - previousPage > 1) {
      // A single hidden page is shown as a number: an ellipsis would hide nothing useful.
      items.push(page - previousPage === 2 ? previousPage + 1 : "ellipsis");
    }
    items.push(page);
  });
  return items;
}

/** Builds the URL of a page keeping the other query parameters (filters, search, sort). */
export function buildPageHref(pathname: string, searchParams: URLSearchParams, page: number): string {
  const nextSearchParams = new URLSearchParams(searchParams);
  if (page <= 1) nextSearchParams.delete("page");
  else nextSearchParams.set("page", String(page));
  const queryString = nextSearchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}
