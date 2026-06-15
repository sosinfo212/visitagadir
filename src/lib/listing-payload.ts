/**
 * Maps an incoming admin API body into a Prisma listing payload.
 * Covers every editable field on the Listing model so admin create/update
 * stay in sync without duplicating field lists.
 */

import { splitImagesForStorage } from '@/lib/listing-images'

/** Fields the admin can edit on a listing. Used for both create + update. */
export interface ListingPayloadInput {
  name?: string
  description?: string
  address?: string
  phone?: string | null
  website?: string | null
  email?: string | null
  image?: string | null
  images?: unknown
  logo?: string | null
  rating?: number
  reviewCount?: number
  featured?: boolean
  published?: boolean
  categoryId?: string
  city?: string
  region?: string | null
  postalCode?: string | null
  country?: string
  latitude?: number | null
  longitude?: number | null
  openingHours?: unknown // array → JSON, string → as-is
  priceRange?: string | null
  seoTitle?: string | null
  metaDescription?: string | null
  metaKeywords?: string | null
  canonicalUrl?: string | null
  schemaType?: string | null
}

export function buildListingPayload(body: ListingPayloadInput): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  // Direct strings
  for (const f of ['name', 'description', 'address', 'city', 'country'] as const) {
    if (body[f] !== undefined) out[f] = body[f]
  }
  // Nullable strings
  for (const f of ['phone', 'website', 'email', 'region', 'postalCode',
    'priceRange', 'seoTitle', 'metaDescription', 'metaKeywords',
    'canonicalUrl', 'schemaType', 'logo'] as const) {
    if (body[f] !== undefined) out[f] = body[f] === '' ? null : body[f]
  }
  // Nullable numbers
  for (const f of ['latitude', 'longitude'] as const) {
    if (body[f] !== undefined) {
      const v = body[f]
      out[f] = v === null || v === undefined || v === ('' as unknown) ? null : Number(v)
      if (typeof out[f] === 'number' && Number.isNaN(out[f])) out[f] = null
    }
  }
  // Booleans / numbers
  if (body.featured !== undefined) out.featured = !!body.featured
  if (body.published !== undefined) out.published = !!body.published
  if (body.rating !== undefined) out.rating = Number(body.rating) || 0
  if (body.reviewCount !== undefined) out.reviewCount = Number(body.reviewCount) || 0
  if (body.categoryId !== undefined) out.categoryId = body.categoryId

  // Images: prefer images[]; legacy image still accepted
  if (Array.isArray(body.images)) {
    const split = splitImagesForStorage(body.images)
    out.image = split.image
    out.gallery = split.gallery
  } else if (body.image !== undefined) {
    out.image = body.image || null
  }

  // Opening hours can come as an array (preferred) or pre-serialized JSON string
  if (body.openingHours !== undefined) {
    if (body.openingHours === null || body.openingHours === '') {
      out.openingHours = null
    } else if (Array.isArray(body.openingHours)) {
      out.openingHours = JSON.stringify(body.openingHours)
    } else if (typeof body.openingHours === 'string') {
      out.openingHours = body.openingHours
    }
  }

  return out
}

/** Fields the admin can edit on a category. */
export interface CategoryPayloadInput {
  name?: string
  slug?: string
  icon?: string
  description?: string | null
  image?: string | null
  defaultSchemaType?: string | null
  seoTitle?: string | null
  metaDescription?: string | null
  metaKeywords?: string | null
  canonicalUrl?: string | null
}

export function buildCategoryPayload(body: CategoryPayloadInput): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of ['name', 'slug', 'icon'] as const) {
    if (body[f] !== undefined) out[f] = body[f]
  }
  for (const f of ['description', 'image', 'defaultSchemaType', 'seoTitle',
    'metaDescription', 'metaKeywords', 'canonicalUrl'] as const) {
    if (body[f] !== undefined) out[f] = body[f] === '' ? null : body[f]
  }
  return out
}
