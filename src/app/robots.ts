/**
 * robots.txt — generated from SeoSettings.
 *
 * Disallows the admin section and any private API routes by default; the
 * site-wide robots directive (`defaultRobots`) is what controls per-page
 * indexability via meta tags. This file is just the crawl-budget side of
 * the conversation.
 */

import type { MetadataRoute } from 'next'
import { getSeoSettings } from '@/lib/seo/repository'

export const revalidate = 3600

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeoSettings()
  const base = seo.siteUrl.replace(/\/$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/admin'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
