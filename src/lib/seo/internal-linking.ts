/**
 * Internal linking engine.
 *
 * Produces server-rendered link bundles so search engines always see the
 * outgoing graph, even if the user-facing UI is hydrated client-side.
 *
 * Three buckets per listing page:
 *  1. Related in same category (sorted by featured + rating)
 *  2. Related in same city (geo-relevance)
 *  3. Nearby (haversine when lat/long present, otherwise same-city fallback)
 *
 * Plus:
 *  - getFeaturedListings()  → homepage
 *  - getAllCategories()     → homepage + category sidebars
 *  - getRelatedCategories() → category sidebar
 *
 * All functions are batched/limited so a single 100k-row DB scan never
 * happens — every call hits an indexed query.
 */

import { db } from '@/lib/db'
import { getListingFeaturedImage } from '@/lib/listing-images'

/**
 * Minimal column set for listing "card" queries. Avoids dragging heavy
 * TEXT/MEDIUMTEXT/LONGTEXT columns (description, logo, gallery-of-base64,
 * SEO overrides…) into internal-linking reads that only render a card link.
 * `image` + `gallery` are kept because the featured-image helper needs them.
 */
const LISTING_CARD_SELECT = {
  name: true,
  slug: true,
  city: true,
  rating: true,
  featured: true,
  image: true,
  gallery: true,
  category: { select: { name: true, slug: true } },
} as const

type ListingCardRow = {
  name: string
  slug: string
  city: string
  rating: number
  featured: boolean
  image: string | null
  gallery: string | null
  category: { name: string; slug: string }
  latitude?: number | null
  longitude?: number | null
}

export interface CategoryLink {
  name: string
  slug: string
  icon: string
}

export interface ListingLink {
  name: string
  slug: string
  city: string
  categoryName: string
  categorySlug: string
  featured: boolean
  rating: number
  image: string | null
}

export async function getAllCategories(limit = 24): Promise<CategoryLink[]> {
  const cats = await db.category.findMany({
    orderBy: { name: 'asc' },
    take: limit,
    select: { name: true, slug: true, icon: true },
  })
  return cats
}

export async function getFeaturedListings(limit = 8): Promise<ListingLink[]> {
  const rows = await db.listing.findMany({
    where: { featured: true, published: true },
    orderBy: { rating: 'desc' },
    take: limit,
    select: LISTING_CARD_SELECT,
  })
  return rows.map(mapListing)
}

export async function getRelatedCategories(currentSlug: string, limit = 6): Promise<CategoryLink[]> {
  // "Related" here is "everything else" — small directories don't have a
  // semantic graph yet. For 100k+ rows we'd swap this for a tag-based or
  // co-visit query without touching callers.
  const cats = await db.category.findMany({
    where: { slug: { not: currentSlug } },
    take: limit,
    orderBy: { updatedAt: 'desc' },
    select: { name: true, slug: true, icon: true },
  })
  return cats
}

export async function getListingsInCategory(slug: string, limit = 50): Promise<ListingLink[]> {
  const cat = await db.category.findUnique({ where: { slug } })
  if (!cat) return []
  const rows = await db.listing.findMany({
    where: { categoryId: cat.id, published: true },
    orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
    take: limit,
    select: LISTING_CARD_SELECT,
  })
  return rows.map(mapListing)
}

export async function getRelatedInCategory(args: {
  categoryId: string
  excludeListingId: string
  limit?: number
}): Promise<ListingLink[]> {
  const rows = await db.listing.findMany({
    where: {
      categoryId: args.categoryId,
      id: { not: args.excludeListingId },
      published: true,
    },
    orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
    take: args.limit ?? 6,
    select: LISTING_CARD_SELECT,
  })
  return rows.map(mapListing)
}

export async function getSameCity(args: {
  city: string
  excludeListingId: string
  limit?: number
}): Promise<ListingLink[]> {
  const rows = await db.listing.findMany({
    where: {
      city: args.city,
      id: { not: args.excludeListingId },
      published: true,
    },
    orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
    take: args.limit ?? 6,
    select: LISTING_CARD_SELECT,
  })
  return rows.map(mapListing)
}

/**
 * Returns nearby listings using haversine distance when both the source
 * and target have coordinates. Falls back to same-city when geo is missing.
 *
 * Cheap implementation suitable for a few thousand candidates. Past that,
 * swap in PostGIS / a Cell index without touching callers.
 */
export async function getNearby(args: {
  lat: number | null
  lng: number | null
  city: string
  excludeListingId: string
  limit?: number
}): Promise<ListingLink[]> {
  const limit = args.limit ?? 6
  if (args.lat == null || args.lng == null) {
    return getSameCity({ city: args.city, excludeListingId: args.excludeListingId, limit })
  }

  // Bounding box pre-filter to keep the candidate set small (~25km radius).
  const deltaLat = 25 / 111 // ~0.225°
  const deltaLng = 25 / (111 * Math.cos((args.lat * Math.PI) / 180))
  const candidates = await db.listing.findMany({
    where: {
      id: { not: args.excludeListingId },
      published: true,
      latitude: { gte: args.lat - deltaLat, lte: args.lat + deltaLat },
      longitude: { gte: args.lng - deltaLng, lte: args.lng + deltaLng },
    },
    take: 80,
    select: { ...LISTING_CARD_SELECT, latitude: true, longitude: true },
  })

  const ranked = candidates
    .map(l => ({
      l,
      d: haversineKm(args.lat!, args.lng!, l.latitude ?? 0, l.longitude ?? 0),
    }))
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map(({ l }) => l)

  return ranked.map(mapListing)
}

export interface CityWithCount {
  city: string
  count: number
}

/** Distinct cities that have at least one listing, with counts. */
export async function getCitiesWithCounts(limit = 100): Promise<CityWithCount[]> {
  const rows = await db.listing.groupBy({
    by: ['city'],
    _count: { city: true },
    orderBy: { _count: { city: 'desc' } },
    take: limit,
  })
  return rows.map(r => ({ city: r.city, count: r._count.city }))
}

export async function getListingsInCity(city: string, limit = 50): Promise<ListingLink[]> {
  const rows = await db.listing.findMany({
    where: { city, published: true },
    orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
    take: limit,
    select: LISTING_CARD_SELECT,
  })
  return rows.map(mapListing)
}

// ─── Internals ─────────────────────────────────────────

function mapListing(l: ListingCardRow): ListingLink {
  return {
    name: l.name,
    slug: l.slug,
    city: l.city,
    categoryName: l.category.name,
    categorySlug: l.category.slug,
    featured: l.featured,
    rating: l.rating,
    image: getListingFeaturedImage(l.image, l.gallery),
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Keep sidebar listing blocks unique — priority: category → city → nearby. */
export function dedupeListingSidebarSections(sections: {
  related: ListingLink[]
  sameCity: ListingLink[]
  nearby: ListingLink[]
}): { related: ListingLink[]; sameCity: ListingLink[]; nearby: ListingLink[] } {
  const seen = new Set<string>()
  const unique = (items: ListingLink[]) => {
    const out: ListingLink[] = []
    for (const item of items) {
      if (seen.has(item.slug)) continue
      seen.add(item.slug)
      out.push(item)
    }
    return out
  }
  return {
    related: unique(sections.related),
    sameCity: unique(sections.sameCity),
    nearby: unique(sections.nearby),
  }
}
