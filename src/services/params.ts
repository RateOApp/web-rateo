/**
 * Query-string builders shared by the client (axios) and server (fetch)
 * variants of each service. Kept dependency-free so a server module can import
 * it without dragging in the `'use client'` axios instance.
 */

export type JobListParams = {
  pageNumber?: number;
  keyword?: string;
  /** Comma list or array of industries. Omitted means "everything". */
  categories?: string | string[];
};

export type CompanyListParams = {
  pageNumber?: number;
  keyword?: string;
};

/**
 * IMPORTANT: when `categories` is absent the backend personalises the feed from
 * the logged-in individual's `jobPreferences`. Public pages must therefore
 * always send an explicit value, defaulting to `all`.
 */
export function jobListQuery(params: JobListParams = {}): Record<string, string> {
  const categories = Array.isArray(params.categories)
    ? params.categories.filter(Boolean).join(',')
    : params.categories;

  const query: Record<string, string> = {
    pageNumber: String(params.pageNumber ?? 1),
    categories: categories && categories.trim() ? categories.trim() : 'all',
  };
  if (params.keyword?.trim()) query.keyword = params.keyword.trim();
  return query;
}

export function companyListQuery(params: CompanyListParams = {}): Record<string, string> {
  const query: Record<string, string> = {
    role: 'company',
    pageNumber: String(params.pageNumber ?? 1),
  };
  if (params.keyword?.trim()) query.keyword = params.keyword.trim();
  return query;
}

/** `{ a: '1' } -> '?a=1'` (empty string when there is nothing to encode). */
export function toSearchString(query: Record<string, string>): string {
  const search = new URLSearchParams(query).toString();
  return search ? `?${search}` : '';
}
