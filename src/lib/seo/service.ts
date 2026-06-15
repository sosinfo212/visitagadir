/**
 * SEO service layer — orchestrates repository, metadata, schema, and cache.
 *
 * Controllers (API routes / page generators) should call into this module
 * instead of reaching for Prisma or cache primitives directly. Keeps the
 * architecture modular as new page types (city hubs, FAQ, etc.) are added.
 */

import type { Metadata } from 'next'
import type { Category, Listing, SeoSettings } from '@prisma/client'

import { db } from '@/lib/db'
import { getListingDisplayImages } from '@/lib/listing-images'
import { cacheInvalidate } from './cache'
import {
  getSeoSettings,
  getSchemaSettings,
  updateSeoSettings,
  updateSchemaSettings,
  listRedirects,
  createRedirect,
  updateRedirect,
  deleteRedirect,
} from './repository'
import { buildMetadata, type PageMetaInput } from './metadata'
import {
  buildWebSiteSchema,
  buildOrganizationSchema,
  buildCollectionPageSchema,
  buildBreadcrumbSchema,
  buildLocalBusinessSchema,
  buildCityCollectionPageSchema,
  buildReviewSchemas,
} from './schema'
import {
  getAllCategories,
  getFeaturedListings,
  getListingsInCategory,
  getRelatedInCategory,
  getSameCity,
  getNearby,
  getRelatedCategories,
  getCitiesWithCounts,
  getListingsInCity,
  dedupeListingSidebarSections,
  type CategoryLink,
  type ListingLink,
} from './internal-linking'
import { categoryPath, listingPath, cityPath, citySlug, ensureAbsolute } from './url'
import {
  validateSeoSettingsPatch,
  validateSchemaSettingsPatch,
  validateRedirectInput,
  validateSocialProfiles,
} from './validation'
import { parseSocialProfiles, type SocialProfile } from './types'

export { getSeoSettings, getSchemaSettings }

export async function getGlobalSchemas(): Promise<unknown[]> {
  const [seo, schemaCfg] = await Promise.all([getSeoSettings(), getSchemaSettings()])
  return [buildWebSiteSchema(seo, schemaCfg), buildOrganizationSchema(seo, schemaCfg)]
}

export function buildPageMetadata(seo: SeoSettings, input: PageMetaInput): Metadata {
  return buildMetadata(seo, input)
}

// ─── Listing page bundle ─────────────────────────────────

export async function getListingSeoBundle(slug: string) {
  const listing = await db.listing.findUnique({
    where: { slug },
    include: {
      category: { select: { name: true, slug: true, icon: true, defaultSchemaType: true } },
      reviews: { where: { approved: true }, orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })
  if (!listing || !listing.published) return null

  const [seo, schemaCfg, relatedRaw, sameCityRaw, nearbyRaw] = await Promise.all([
    getSeoSettings(),
    getSchemaSettings(),
    getRelatedInCategory({ categoryId: listing.categoryId, excludeListingId: listing.id, limit: 6 }),
    getSameCity({ city: listing.city, excludeListingId: listing.id, limit: 6 }),
    getNearby({
      lat: listing.latitude,
      lng: listing.longitude,
      city: listing.city,
      excludeListingId: listing.id,
      limit: 6,
    }),
  ])

  const { related, sameCity, nearby } = dedupeListingSidebarSections({
    related: relatedRaw,
    sameCity: sameCityRaw,
    nearby: nearbyRaw,
  })

  const images = getListingDisplayImages(listing.image, listing.gallery)
  const breadcrumbs = [
    { name: 'Home', url: seo.siteUrl },
    { name: listing.category.name, url: ensureAbsolute(categoryPath(listing.category.slug), seo.siteUrl) },
    { name: listing.name },
  ]

  const schemas = [
    buildOrganizationSchema(seo, schemaCfg),
    buildBreadcrumbSchema(breadcrumbs),
    buildLocalBusinessSchema({ listing, images, siteUrl: seo.siteUrl }),
    ...buildReviewSchemas(listing.reviews, listing, seo.siteUrl),
  ]

  const metadata = buildMetadata(seo, {
    title: listing.seoTitle || `${listing.name} — ${listing.category.name} in ${listing.city}`,
    description: listing.metaDescription || listing.description.slice(0, 160),
    keywords: listing.metaKeywords,
    image: images[0],
    path: listingPath(listing.slug),
    canonicalOverride: listing.canonicalUrl,
    ogType: 'website',
  })

  return { listing, images, seo, breadcrumbs, schemas, metadata, related, sameCity, nearby }
}

// ─── Category page bundle ────────────────────────────────

export async function getCategorySeoBundle(slug: string) {
  const cat = await db.category.findUnique({ where: { slug } })
  if (!cat) return null

  const [seo, schemaCfg, listings, related] = await Promise.all([
    getSeoSettings(),
    getSchemaSettings(),
    getListingsInCategory(slug, 60),
    getRelatedCategories(slug, 8),
  ])

  const breadcrumbs = [
    { name: 'Home', url: seo.siteUrl },
    { name: cat.name },
  ]

  const schemas = [
    buildOrganizationSchema(seo, schemaCfg),
    buildBreadcrumbSchema(breadcrumbs),
    buildCollectionPageSchema({ category: cat, listings, siteUrl: seo.siteUrl }),
  ]

  const metadata = buildMetadata(seo, {
    title: cat.seoTitle || `${cat.name} in Agadir`,
    description: cat.metaDescription || cat.description || `Browse the best ${cat.name.toLowerCase()} in Agadir, Morocco.`,
    keywords: cat.metaKeywords,
    image: cat.image,
    path: categoryPath(cat.slug),
    canonicalOverride: cat.canonicalUrl,
    ogType: 'website',
  })

  return { cat, seo, listings, related, breadcrumbs, schemas, metadata }
}

// ─── City page bundle ────────────────────────────────────

export async function getCitySeoBundle(citySlugParam: string) {
  const cities = await getCitiesWithCounts()
  const match = cities.find(c => citySlug(c.city) === citySlugParam)
  if (!match) return null

  const [seo, schemaCfg, listings, categories] = await Promise.all([
    getSeoSettings(),
    getSchemaSettings(),
    getListingsInCity(match.city, 60),
    getAllCategories(12),
  ])

  const breadcrumbs = [
    { name: 'Home', url: seo.siteUrl },
    { name: match.city },
  ]

  const schemas = [
    buildOrganizationSchema(seo, schemaCfg),
    buildBreadcrumbSchema(breadcrumbs),
    buildCityCollectionPageSchema({ city: match.city, listings, siteUrl: seo.siteUrl }),
  ]

  const metadata = buildMetadata(seo, {
    title: `Businesses in ${match.city}`,
    description: `Discover ${match.count} local businesses in ${match.city}, Morocco.`,
    path: cityPath(match.city),
    ogType: 'website',
  })

  return { city: match.city, count: match.count, seo, listings, categories, breadcrumbs, schemas, metadata }
}

// ─── Homepage internal linking bundle ────────────────────

export async function getHomepageLinkBundle(): Promise<{
  categories: CategoryLink[]
  featured: ListingLink[]
}> {
  const [categories, featured] = await Promise.all([
    getAllCategories(24),
    getFeaturedListings(8),
  ])
  return { categories, featured }
}

// ─── Admin mutations (validated) ─────────────────────────

export async function saveSeoSettings(patch: Record<string, string | null>) {
  const result = validateSeoSettingsPatch(patch)
  if (!result.ok) throw new SeoValidationError(result.errors)
  return updateSeoSettings(patch)
}

export async function saveSchemaSettings(patch: Record<string, string | null>) {
  const result = validateSchemaSettingsPatch(patch)
  if (!result.ok) throw new SeoValidationError(result.errors)
  return updateSchemaSettings(patch)
}

export async function saveSocialProfiles(profiles: SocialProfile[]) {
  const result = validateSocialProfiles(profiles)
  if (!result.ok) throw new SeoValidationError(result.errors)
  const existing = await getSchemaSettings()
  return updateSchemaSettings({
    socialProfiles: JSON.stringify(profiles),
  }).then(() => ({ profiles, id: existing.id }))
}

export async function addRedirect(source: string, destination: string, statusCode = 301) {
  const result = validateRedirectInput(source, destination)
  if (!result.ok) throw new SeoValidationError(result.errors)
  return createRedirect({ source, destination, statusCode })
}

export async function patchRedirect(
  id: string,
  data: Partial<{ source: string; destination: string; statusCode: number; enabled: boolean }>,
) {
  if (data.source !== undefined && data.destination !== undefined) {
    const result = validateRedirectInput(data.source, data.destination)
    if (!result.ok) throw new SeoValidationError(result.errors)
  }
  return updateRedirect(id, data)
}

export async function removeRedirect(id: string) {
  return deleteRedirect(id)
}

export async function getRedirectList() {
  return listRedirects()
}

export async function invalidateSeoCache() {
  cacheInvalidate('seo:')
}

export async function getSitemapStats() {
  const [seo, listingCount, categoryCount, cities] = await Promise.all([
    getSeoSettings(),
    db.listing.count(),
    db.category.count(),
    getCitiesWithCounts(),
  ])
  const cityCount = cities.length
  return {
    siteUrl: seo.siteUrl,
    sitemapUrl: `${seo.siteUrl.replace(/\/$/, '')}/sitemap.xml`,
    robotsUrl: `${seo.siteUrl.replace(/\/$/, '')}/robots.txt`,
    stats: {
      categories: categoryCount,
      listings: listingCount,
      cities: cityCount,
      total: 1 + categoryCount + listingCount + cityCount,
    },
  }
}

export async function getInternalLinkingPreview() {
  const [categories, featured, cities] = await Promise.all([
    getAllCategories(12),
    getFeaturedListings(6),
    getCitiesWithCounts(),
  ])
  return {
    homepage: { categories: categories.length, featured: featured.length },
    categories: categories.map(c => ({ name: c.name, slug: c.slug })),
    featured: featured.map(l => ({ name: l.name, slug: l.slug })),
    cities: cities.slice(0, 12).map(c => ({ city: c.city, slug: citySlug(c.city), count: c.count })),
    policies: {
      categoryPage: 'Links to all listings in category + related categories sidebar',
      listingPage: 'Same category, same city, and nearby (haversine) blocks',
      cityPage: 'All listings in city + major category shortcuts',
    },
  }
}

export class SeoValidationError extends Error {
  errors: string[]
  constructor(errors: string[]) {
    super(errors.join('; '))
    this.name = 'SeoValidationError'
    this.errors = errors
  }
}
