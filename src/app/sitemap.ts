/**
 * Dynamic XML sitemap.
 *
 * Lists homepage, static pages, blog posts, categories, cities and listings.
 * Revalidates hourly; rebuilds from DB on each request.
 * For 100k+ URLs, switch to generateSitemaps() index pattern.
 *
 * Deliberately excluded:
 *  - Blog-category archives (/blog/category/*) — they are noindex,follow (thin
 *    nav pages), so a sitemap must not advertise them.
 *  - <priority>/<changefreq> — Google ignores both; only <lastmod> is emitted.
 */

import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { getSeoSettings } from '@/lib/seo/repository'
import { getCitiesWithCounts } from '@/lib/seo/internal-linking'
import { categoryPath, listingPath, cityPath, blogPostPath, ensureAbsolute } from '@/lib/seo/url'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSeoSettings()
  const base = seo.siteUrl

  const [categories, listings, cities, blogPosts] = await Promise.all([
    db.category.findMany({ select: { slug: true, updatedAt: true } }),
    db.listing.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    getCitiesWithCounts(200),
    db.blogPost.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true, publishedAt: true },
    }),
  ])

  const now = new Date()
  const staticPaths = ['/about', '/contact', '/advertise', '/privacy', '/terms']

  return [
    { url: ensureAbsolute('/', base), lastModified: now },
    ...staticPaths.map((p) => ({ url: ensureAbsolute(p, base), lastModified: now })),
    { url: ensureAbsolute('/blog', base), lastModified: now },
    ...blogPosts.map((p) => ({
      url: ensureAbsolute(blogPostPath(p.slug), base),
      lastModified: p.publishedAt ?? p.updatedAt,
    })),
    ...categories.map((c) => ({
      url: ensureAbsolute(categoryPath(c.slug), base),
      lastModified: c.updatedAt,
    })),
    ...cities.map((c) => ({
      url: ensureAbsolute(cityPath(c.city), base),
      lastModified: now,
    })),
    ...listings.map((l) => ({
      url: ensureAbsolute(listingPath(l.slug), base),
      lastModified: l.updatedAt,
    })),
  ]
}
