/**
 * Metadata builders.
 *
 * These convert a page descriptor + SeoSettings into the Metadata object
 * Next.js expects from `generateMetadata`. They handle:
 *   - title templating (per-page %s injection)
 *   - canonical URL (manual override → generated)
 *   - keywords (comma-separated string -> array)
 *   - robots
 *   - Open Graph (title, description, image, url, type)
 *   - Twitter card
 *
 * Per-page overrides always win over generated values; generated values
 * always win over the defaults from SeoSettings. Empty strings are treated
 * as "fall back" — useful when the admin clears a field.
 */

import type { Metadata } from 'next'
import type { SeoSettings } from '@prisma/client'
import { ensureAbsolute } from './url'

type Robots = string

export interface PageMetaInput {
  title?: string | null         // page-specific title; will be templated
  description?: string | null
  keywords?: string | null      // comma-separated
  image?: string | null         // page-specific OG image
  path: string                  // request path, e.g. /listing/foo
  canonicalOverride?: string | null
  ogType?: 'website' | 'article' | 'profile'
  robots?: Robots | null
  noindex?: boolean
}

function applyTitleTemplate(template: string, pageTitle: string): string {
  if (!template.includes('%s')) return pageTitle
  return template.replace('%s', pageTitle)
}

function nonEmpty(v: string | null | undefined): string | null {
  if (!v) return null
  const t = v.trim()
  return t.length > 0 ? t : null
}

function splitKeywords(v: string | null | undefined): string[] | undefined {
  const t = nonEmpty(v)
  if (!t) return undefined
  const list = t.split(',').map(s => s.trim()).filter(Boolean)
  return list.length > 0 ? list : undefined
}

export function buildMetadata(seo: SeoSettings, input: PageMetaInput): Metadata {
  const pageTitleRaw = nonEmpty(input.title)
  const finalTitle = pageTitleRaw
    ? applyTitleTemplate(seo.titleTemplate, pageTitleRaw)
    : seo.defaultTitle

  const finalDescription = nonEmpty(input.description) ?? seo.defaultDescription
  const finalKeywords = splitKeywords(input.keywords) ?? splitKeywords(seo.defaultKeywords)

  const robots = input.noindex
    ? 'noindex,nofollow'
    : (nonEmpty(input.robots) ?? seo.defaultRobots)

  const canonical = nonEmpty(input.canonicalOverride)
    ?? ensureAbsolute(input.path, seo.canonicalDomain || seo.siteUrl)

  const ogImage = nonEmpty(input.image) ?? nonEmpty(seo.defaultOgImage)
  const ogImageAbs = ogImage ? ensureAbsolute(ogImage, seo.siteUrl) : null

  const meta: Metadata = {
    title: finalTitle,
    description: finalDescription,
    metadataBase: safeMetadataBase(seo.siteUrl),
    alternates: { canonical },
    robots,
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url: canonical,
      siteName: seo.siteName,
      type: input.ogType ?? 'website',
      locale: seo.defaultLocale,
      images: ogImageAbs ? [{ url: ogImageAbs }] : undefined,
    },
    twitter: {
      card: (seo.twitterCardType as 'summary' | 'summary_large_image') ?? 'summary_large_image',
      title: finalTitle,
      description: finalDescription,
      images: ogImageAbs ? [ogImageAbs] : undefined,
      site: nonEmpty(seo.twitterHandle) ?? undefined,
      creator: nonEmpty(seo.twitterHandle) ?? undefined,
    },
    icons: { icon: seo.faviconUrl },
  }
  if (finalKeywords) meta.keywords = finalKeywords
  return meta
}

function safeMetadataBase(siteUrl: string): URL | undefined {
  try {
    return new URL(siteUrl)
  } catch {
    return undefined
  }
}
