export const MAIL_LIST_PAGE_SIZE = 20;

export function parseMailListPage(value: string | null): number {
  const n = parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function clampMailListPage(page: number, totalItems: number): number {
  const totalPages = Math.max(1, Math.ceil(totalItems / MAIL_LIST_PAGE_SIZE));
  return Math.min(Math.max(1, page), totalPages);
}
