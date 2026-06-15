export const BLOG_POSTS_PER_PAGE = 12

export function parseBlogPage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw
  const n = Number(value || 1)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.floor(n)
}

export function blogTotalPages(total: number): number {
  return Math.max(1, Math.ceil(total / BLOG_POSTS_PER_PAGE))
}

export function buildBlogListUrl(
  basePath: string,
  page: number,
  params?: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams()
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value)
    }
  }
  if (page > 1) search.set('page', String(page))
  const qs = search.toString()
  return qs ? `${basePath}?${qs}` : basePath
}
