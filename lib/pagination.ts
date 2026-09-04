export function normalizePage(value?: string | null) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function normalizeQuery(value?: string | null, maxLength = 200) {
  return (value ?? '').slice(0, maxLength);
}

export function getPaginationRange(currentPage: number, totalPages: number, pagesAround = 2) {
  if (totalPages <= 0) return [];

  const safeCurrentPage = Math.min(Math.max(Math.trunc(currentPage), 1), totalPages);
  const pageGroup = pagesAround * 2 + 1;
  const startPage = totalPages <= pageGroup
    ? 1
    : Math.max(1, Math.min(safeCurrentPage - pagesAround, totalPages - pageGroup + 1));
  const endPage = Math.min(totalPages, startPage + pageGroup - 1);

  return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
}
