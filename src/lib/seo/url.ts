/**
 * URL helpers — all paths the SEO module emits go through here so we never
 * leak relative paths into <link rel="canonical"> or Open Graph URLs.
 */

export function ensureAbsolute(url: string, siteUrl: string): string {
  if (/^https?:\/\//i.test(url)) return url
  if (/^data:/i.test(url)) return url // base64 OG images are fine as-is
  const base = siteUrl.replace(/\/$/, '')
  const path = url.startsWith('/') ? url : `/${url}`
  return base + path
}

/** WordPress imports often store `/job/slug/` canonicals — ignore those. */
export function resolveCanonicalOverride(
  override: string | null | undefined,
): string | null {
  const trimmed = override?.trim()
  if (!trimmed) return null

  const legacyJobPath = /\/job\//i.test(trimmed)
  if (legacyJobPath) return null

  return trimmed
}

export function categoryPath(slug: string): string {
  return `/category/${encodeURIComponent(slug)}`
}

export function listingPath(slug: string): string {
  return `/listing/${encodeURIComponent(slug)}`
}

export function categoryUrl(slug: string, siteUrl: string): string {
  return ensureAbsolute(categoryPath(slug), siteUrl)
}

export function listingUrl(slug: string, siteUrl: string): string {
  return ensureAbsolute(listingPath(slug), siteUrl)
}

/** Slugify a city name for /city/[slug] routes. */
export function citySlug(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function cityPath(city: string): string {
  return `/city/${encodeURIComponent(citySlug(city))}`
}

export function cityUrl(city: string, siteUrl: string): string {
  return ensureAbsolute(cityPath(city), siteUrl)
}

export function blogPath(): string {
  return '/blog'
}

export function blogCategoryPath(slug: string): string {
  return `/blog/category/${encodeURIComponent(slug)}`
}

export function blogCategoryUrl(slug: string, siteUrl: string): string {
  return ensureAbsolute(blogCategoryPath(slug), siteUrl)
}

export function blogPostPath(slug: string): string {
  return `/blog/${encodeURIComponent(slug)}`
}

export function blogPostUrl(slug: string, siteUrl: string): string {
  return ensureAbsolute(blogPostPath(slug), siteUrl)
}
