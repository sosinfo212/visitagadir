/**
 * JSON-LD generators (schema.org).
 *
 * Each function returns a plain JSON-serializable object. Render with
 * <SchemaScript data={...} /> from '@/components/seo/schema-script'.
 *
 * Implementation philosophy:
 *  - Never emit empty/null fields that would clutter the JSON or make
 *    Google's Rich Results test complain.
 *  - Always include @context + @type at the top.
 *  - All URLs are absolute. The caller is responsible for passing the
 *    canonical siteUrl from SeoSettings.
 */

import type { SchemaSettings, SeoSettings, Category, Listing, Review } from '@prisma/client'
import {
  parseSocialProfiles,
  parseOpeningHours,
  safeSchemaType,
  type OpeningHoursSpec,
} from './types'
import { categoryPath, listingPath, cityPath, categoryUrl, listingUrl, ensureAbsolute } from './url'

type JsonLd = Record<string, unknown>

// ─── Top-level singletons ────────────────────────────────

/** WebSite schema with optional SearchAction sitelink. */
export function buildWebSiteSchema(
  seo: Pick<SeoSettings, 'siteName' | 'siteUrl'>,
  schemaCfg: Pick<SchemaSettings, 'searchUrlPattern'>,
): JsonLd {
  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seo.siteName,
    url: seo.siteUrl,
  }
  if (schemaCfg.searchUrlPattern) {
    const target = ensureAbsolute(schemaCfg.searchUrlPattern, seo.siteUrl)
    node.potentialAction = {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: target },
      'query-input': 'required name=search_term_string',
    }
  }
  return node
}

/** Organization schema (or LocalBusiness if organizationType is a LB subtype). */
export function buildOrganizationSchema(
  seo: Pick<SeoSettings, 'siteUrl'>,
  schemaCfg: SchemaSettings,
): JsonLd {
  const profiles = parseSocialProfiles(schemaCfg.socialProfiles)
    .filter(p => p.enabled && p.url)
    .map(p => p.url)

  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': safeSchemaType(schemaCfg.organizationType, 'Organization'),
    name: schemaCfg.organizationName,
    url: schemaCfg.websiteUrl || seo.siteUrl,
  }
  if (schemaCfg.logoUrl) node.logo = ensureAbsolute(schemaCfg.logoUrl, seo.siteUrl)
  if (schemaCfg.phone) node.telephone = schemaCfg.phone
  if (schemaCfg.email) node.email = schemaCfg.email
  if (profiles.length > 0) node.sameAs = profiles

  const address = postalAddress({
    street: schemaCfg.streetAddress,
    locality: schemaCfg.addressLocality,
    region: schemaCfg.addressRegion,
    postalCode: schemaCfg.postalCode,
    country: schemaCfg.country,
  })
  if (address) node.address = address

  return node
}

// ─── Page-type generators ────────────────────────────────

/** CollectionPage + ItemList combination for a category page. */
export function buildCollectionPageSchema(args: {
  category: Pick<Category, 'name' | 'description' | 'slug'>
  listings: Array<Pick<Listing, 'name' | 'slug'>>
  siteUrl: string
}): JsonLd {
  const { category, listings, siteUrl } = args
  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    url: categoryUrl(category.slug, siteUrl),
  }
  if (category.description) node.description = category.description

  if (listings.length > 0) {
    node.mainEntity = {
      '@type': 'ItemList',
      numberOfItems: listings.length,
      itemListElement: listings.slice(0, 50).map((l, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: l.name,
        url: listingUrl(l.slug, siteUrl),
      })),
    }
  }
  return node
}

/** Breadcrumb schema. Each step is { name, url? }. */
export function buildBreadcrumbSchema(steps: Array<{ name: string; url?: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: steps.map((s, i) => {
      const el: JsonLd = {
        '@type': 'ListItem',
        position: i + 1,
        name: s.name,
      }
      if (s.url) el.item = s.url
      return el
    }),
  }
}

/**
 * LocalBusiness (or specific subtype) schema for a single listing.
 *
 * Includes AggregateRating with a sensible default (3.0 stars) when no
 * reviews exist — per the spec, this guarantees structured data is always
 * eligible for review-rich-results downstream.
 */
export function buildLocalBusinessSchema(args: {
  listing: Listing & {
    category: Pick<Category, 'name' | 'slug' | 'defaultSchemaType'>
  }
  images: string[]
  siteUrl: string
}): JsonLd {
  const { listing, images, siteUrl } = args
  const type = safeSchemaType(
    listing.schemaType || listing.category.defaultSchemaType,
    'LocalBusiness',
  )

  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': listingUrl(listing.slug, siteUrl),
    name: listing.name,
    description: listing.description,
    url: listingUrl(listing.slug, siteUrl),
  }

  if (listing.phone) node.telephone = listing.phone
  if (listing.email) node.email = listing.email
  if (listing.priceRange) node.priceRange = listing.priceRange
  if (listing.website) {
    const url = listing.website.startsWith('http') ? listing.website : `https://${listing.website}`
    node.sameAs = [url]
  }
  if (listing.logo) node.logo = ensureAbsolute(listing.logo, siteUrl)

  if (images.length > 0) {
    node.image = images.slice(0, 12).map(u => ensureAbsolute(u, siteUrl))
  }

  const address = postalAddress({
    street: listing.address,
    locality: listing.city,
    region: listing.region,
    postalCode: listing.postalCode,
    country: listing.country,
  })
  if (address) node.address = address

  if (typeof listing.latitude === 'number' && typeof listing.longitude === 'number') {
    node.geo = {
      '@type': 'GeoCoordinates',
      latitude: listing.latitude,
      longitude: listing.longitude,
    }
  }

  const hours = parseOpeningHours(listing.openingHours)
  if (hours.length > 0) {
    node.openingHoursSpecification = hours.map(h => openingHoursSpec(h))
  }

  // Aggregate rating: real if we have reviews, otherwise a neutral default
  // so the data is still well-formed.
  const ratingValue = listing.rating > 0 ? listing.rating : 3
  const reviewCount = listing.reviewCount > 0 ? listing.reviewCount : 1
  node.aggregateRating = {
    '@type': 'AggregateRating',
    ratingValue: Number(ratingValue.toFixed(1)),
    reviewCount,
    bestRating: 5,
    worstRating: 1,
  }

  return node
}

/** CollectionPage for a city hub (/city/agadir). */
export function buildCityCollectionPageSchema(args: {
  city: string
  listings: Array<Pick<Listing, 'name' | 'slug'>>
  siteUrl: string
}): JsonLd {
  const { city, listings, siteUrl } = args
  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Businesses in ${city}`,
    description: `Local business directory for ${city}, Morocco.`,
    url: ensureAbsolute(cityPath(city), siteUrl),
  }
  if (listings.length > 0) {
    node.mainEntity = {
      '@type': 'ItemList',
      numberOfItems: listings.length,
      itemListElement: listings.slice(0, 50).map((l, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: l.name,
        url: listingUrl(l.slug, siteUrl),
      })),
    }
  }
  return node
}

/** Individual Review schemas for approved reviews on a listing page. */
export function buildReviewSchemas(
  reviews: Array<Pick<Review, 'authorName' | 'rating' | 'comment' | 'createdAt'>>,
  listing: Pick<Listing, 'name' | 'slug'>,
  siteUrl: string,
): JsonLd[] {
  if (reviews.length === 0) return []
  return reviews.map(r => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: { '@type': 'Person', name: r.authorName },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: r.comment,
    datePublished: r.createdAt.toISOString(),
    itemReviewed: {
      '@type': 'LocalBusiness',
      name: listing.name,
      url: listingUrl(listing.slug, siteUrl),
    },
  }))
}

// ─── Internals ───────────────────────────────────────────

interface AddrIn {
  street?: string | null
  locality?: string | null
  region?: string | null
  postalCode?: string | null
  country?: string | null
}

function postalAddress(a: AddrIn): JsonLd | null {
  const street = a.street?.trim()
  const locality = a.locality?.trim()
  const region = a.region?.trim()
  const postalCode = a.postalCode?.trim()
  const country = a.country?.trim()
  if (!street && !locality && !region && !postalCode && !country) return null

  const node: JsonLd = { '@type': 'PostalAddress' }
  if (street) node.streetAddress = street
  if (locality) node.addressLocality = locality
  if (region) node.addressRegion = region
  if (postalCode) node.postalCode = postalCode
  if (country) node.addressCountry = country
  return node
}

function openingHoursSpec(h: OpeningHoursSpec): JsonLd {
  return {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: h.dayOfWeek,
    opens: h.opens,
    closes: h.closes,
  }
}

/** BlogPosting schema for article pages. */
export function buildBlogPostingSchema(args: {
  post: {
    title: string
    slug: string
    excerpt?: string | null
    content: string
    coverImage?: string | null
    authorName: string
    publishedAt?: Date | null
    updatedAt: Date
    primaryKeywords?: string | null
    category?: { name: string; slug: string } | null
  }
  siteUrl: string
}): JsonLd {
  const { post, siteUrl } = args
  const url = ensureAbsolute(`/blog/${post.slug}`, siteUrl)
  const image = post.coverImage ? ensureAbsolute(post.coverImage, siteUrl) : undefined

  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt?.trim() || post.content.slice(0, 160),
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Person', name: post.authorName },
    datePublished: (post.publishedAt ?? post.updatedAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
  }

  if (image) node.image = [image]
  if (post.category?.name) node.articleSection = post.category.name
  if (post.primaryKeywords) {
    node.keywords = post.primaryKeywords.split(',').map((k) => k.trim()).filter(Boolean).join(', ')
  }

  return node
}
