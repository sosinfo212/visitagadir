/**
 * Dynamic XML sitemap.
 *
 * Includes homepage, categories, cities, and listings.
 * Revalidates hourly; rebuilds from DB on each request.
 * For 100k+ URLs, switch to generateSitemaps() index pattern.
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

  // Blog-category archives are intentionally noindex,follow (thin nav pages) —
  // so they are deliberately NOT listed here (a sitemap must not advertise
  // noindexed URLs).
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

  const staticPages = [
    { path: '/about', priority: 0.4 },
    { path: '/contact', priority: 0.4 },
    { path: '/advertise', priority: 0.5 },
    { path: '/privacy', priority: 0.3 },
    { path: '/terms', priority: 0.3 },
  ] as const

  return [
    {
      url: ensureAbsolute('/', base),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...staticPages.map((p) => ({
      url: ensureAbsolute(p.path, base),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: p.priority,
    })),
    {
      url: ensureAbsolute('/blog', base),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    ...blogPosts.map((p) => ({
      url: ensureAbsolute(blogPostPath(p.slug), base),
      lastModified: p.publishedAt ?? p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
    ...categories.map(c => ({
      url: ensureAbsolute(categoryPath(c.slug), base),
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...cities.map(c => ({
      url: ensureAbsolute(cityPath(c.city), base),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...listings.map(l => ({
      url: ensureAbsolute(listingPath(l.slug), base),
      lastModified: l.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]
}
