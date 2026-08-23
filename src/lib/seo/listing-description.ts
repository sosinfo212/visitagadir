/**
 * Thin-content fallback for listing descriptions.
 *
 * Many imported listings have an empty or one-line description (audit found
 * meta descriptions of 22–66 chars). Google deprioritises thin pages, which
 * compounds the discovery problem. When a listing's own description is too
 * short to be useful, synthesise a real one from its structured fields
 * (name, category, city, rating, price). Substantial descriptions — including
 * HTML-formatted ones — are returned untouched.
 *
 * Render-time only: no DB migration, applies to every listing instantly, and
 * self-updates as the underlying data changes. Feeds the on-page body, the
 * meta description, and the LocalBusiness schema (all read listing.description).
 */

import type { Listing, Category } from '@prisma/client'

type ListingLike = Pick<
  Listing,
  'name' | 'city' | 'description' | 'rating' | 'reviewCount' | 'priceRange'
> & { category?: Pick<Category, 'name'> | null }

/** A real description this long (tags stripped) is kept as-is. */
const MIN_REAL_LENGTH = 120

/** Plain-text length of a possibly-HTML string. */
function textLength(html: string): number {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().length
}

export function buildListingDescription(listing: ListingLike): string {
  const raw = listing.description ?? ''
  if (textLength(raw) >= MIN_REAL_LENGTH) return raw

  const name = listing.name?.trim() || 'This business'
  const category = listing.category?.name?.trim().toLowerCase()
  const city = listing.city?.trim()

  const sentences: string[] = []

  // Dash-joined lead avoids grammatical clashes with plural category names
  // ("Hotels & Accommodation", "Restaurants & Cafés").
  const place = city ? `${city}, Morocco` : 'Agadir, Morocco'
  const lead = category ? `${name} — ${category} in ${place}` : `${name} — local business in ${place}`
  sentences.push(`${lead}.`)

  if (listing.reviewCount > 0 && listing.rating > 0) {
    sentences.push(
      `Rated ${listing.rating.toFixed(1)}★ from ${listing.reviewCount} review${listing.reviewCount === 1 ? '' : 's'}.`,
    )
  }

  if (listing.priceRange?.trim()) {
    sentences.push(`Price range: ${listing.priceRange.trim()}.`)
  }

  sentences.push('Find contact details, opening hours, photos and reviews on Visit Agadir.')

  return sentences.join(' ')
}
