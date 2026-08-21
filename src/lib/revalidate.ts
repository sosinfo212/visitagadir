/**
 * On-demand ISR revalidation helpers.
 *
 * Detail pages (listing/category/city/blog) are cached with `revalidate = 3600`.
 * Without an explicit bust, admin edits wouldn't show for up to an hour. These
 * helpers are called from admin mutation routes so changes publish immediately.
 * Each call is best-effort — a revalidation failure must never fail the mutation.
 */

import { revalidatePath } from 'next/cache'

function safe(path: string) {
  try {
    revalidatePath(path)
  } catch {
    /* best-effort */
  }
}

/** A listing changed: refresh its detail page, its category, the homepage, and the sitemap. */
export function revalidateListing(slug?: string | null, categorySlug?: string | null) {
  safe('/')
  if (slug) safe(`/listing/${slug}`)
  if (categorySlug) safe(`/category/${categorySlug}`)
  safe('/sitemap.xml')
}

/** A blog post changed: refresh its page, the blog index, and the sitemap. */
export function revalidateBlogPost(slug?: string | null) {
  safe('/blog')
  if (slug) safe(`/blog/${slug}`)
  safe('/sitemap.xml')
}

/** A category changed: refresh its page and the homepage. */
export function revalidateCategory(slug?: string | null) {
  safe('/')
  if (slug) safe(`/category/${slug}`)
  safe('/sitemap.xml')
}
