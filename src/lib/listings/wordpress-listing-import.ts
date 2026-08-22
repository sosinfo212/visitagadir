import path from 'path'
import { db } from '@/lib/db'
import { slugify, isValidSlug } from '@/lib/blog/slug'
import { extractMediaUrls, MediaImporter, rewriteMediaUrls } from '@/lib/blog/import-media'
import { parseWordPressXml, type WpItem } from '@/lib/blog/wordpress-parser'
import { splitImagesForStorage } from '@/lib/listing-images'
import {
  mapPriceRange,
  parseAddressParts,
  parseCoordinate,
  parseJobHours,
  parsePhpAttachmentIds,
} from '@/lib/listings/wordpress-php-meta'
import { pickListingCategory, type WpCategoryMapping } from '@/lib/listings/wordpress-category-map'

export interface WordPressListingImportOptions {
  skipExisting?: boolean
  includeDrafts?: boolean
}

export interface WordPressListingImportResult {
  listingsImported: number
  listingsSkipped: number
  listingsFailed: number
  categoriesCreated: number
  mediaDownloaded: number
  mediaFailed: number
  errors: string[]
}

import { resolveUploadDir } from '@/lib/upload-paths'

const LISTING_MEDIA_DIR = resolveUploadDir('listings', 'imported')

function resolveAttachmentUrl(
  attachmentId: string | undefined,
  attachmentById: Map<string, string>,
): string | null {
  if (!attachmentId?.trim()) return null
  return attachmentById.get(attachmentId.trim()) ?? null
}

async function ensureCategory(
  categoryRef: WpCategoryMapping | null,
  created: Set<string>,
): Promise<{ categoryId: string; schemaType: string | null }> {
  if (!categoryRef) {
    const fallback = await db.category.findFirst({ orderBy: { name: 'asc' } })
    if (!fallback) throw new Error('No categories available. Create at least one category first.')
    return { categoryId: fallback.id, schemaType: fallback.defaultSchemaType ?? 'LocalBusiness' }
  }

  const existing = await db.category.findUnique({ where: { slug: categoryRef.slug } })
  if (existing) {
    return {
      categoryId: existing.id,
      schemaType: existing.defaultSchemaType ?? categoryRef.defaultSchemaType ?? 'LocalBusiness',
    }
  }

  const createdCat = await db.category.create({
    data: {
      name: categoryRef.name,
      slug: categoryRef.slug,
      icon: categoryRef.icon,
      description: `Imported from WordPress (${categoryRef.slug})`,
      defaultSchemaType: categoryRef.defaultSchemaType ?? 'LocalBusiness',
    },
  })
  created.add(categoryRef.slug)
  return { categoryId: createdCat.id, schemaType: createdCat.defaultSchemaType ?? 'LocalBusiness' }
}

function collectMediaUrlsForListing(
  listing: WpItem,
  attachmentById: Map<string, string>,
  siteUrl: string,
): string[] {
  const urls = new Set<string>()

  const thumb = resolveAttachmentUrl(listing.meta.get('_thumbnail_id'), attachmentById)
  if (thumb) urls.add(thumb)

  const logo = resolveAttachmentUrl(listing.meta.get('_job_logo'), attachmentById)
  if (logo) urls.add(logo)

  for (const id of parsePhpAttachmentIds(listing.meta.get('_job_gallery_images'))) {
    const galleryUrl = resolveAttachmentUrl(id, attachmentById)
    if (galleryUrl) urls.add(galleryUrl)
  }

  for (const url of extractMediaUrls(listing.content, siteUrl)) urls.add(url)
  return [...urls]
}

function buildImageFields(
  listing: WpItem,
  attachmentById: Map<string, string>,
  urlMap: Map<string, string>,
): { image: string | null; gallery: string | null; logo: string | null } {
  const images: string[] = []

  const thumbRemote = resolveAttachmentUrl(listing.meta.get('_thumbnail_id'), attachmentById)
  if (thumbRemote) {
    const local = urlMap.get(thumbRemote)
    if (local) images.push(local)
  }

  for (const id of parsePhpAttachmentIds(listing.meta.get('_job_gallery_images'))) {
    const remote = resolveAttachmentUrl(id, attachmentById)
    if (!remote) continue
    const local = urlMap.get(remote)
    if (local && !images.includes(local)) images.push(local)
  }

  const logoRemote = resolveAttachmentUrl(listing.meta.get('_job_logo'), attachmentById)
  const logo = logoRemote ? urlMap.get(logoRemote) ?? null : null

  const split = splitImagesForStorage(images)
  return { image: split.image, gallery: split.gallery, logo }
}

function sanitizeWebsite(raw: string | undefined | null): string | null {
  const value = raw?.trim()
  if (!value) return null
  // Prisma String columns default to VARCHAR(191) on MySQL — keep URLs within safe length.
  return value.length > 190 ? value.slice(0, 190) : value
}

export async function importWordPressListings(
  xml: string,
  options: WordPressListingImportOptions = {},
): Promise<WordPressListingImportResult> {
  const skipExisting = options.skipExisting !== false
  const includeDrafts = options.includeDrafts === true

  const result: WordPressListingImportResult = {
    listingsImported: 0,
    listingsSkipped: 0,
    listingsFailed: 0,
    categoriesCreated: 0,
    mediaDownloaded: 0,
    mediaFailed: 0,
    errors: [],
  }

  const parsed = parseWordPressXml(xml)
  const attachmentById = new Map<string, string>()
  for (const att of parsed.attachments) {
    if (att.postId && att.attachmentUrl) {
      attachmentById.set(att.postId, att.attachmentUrl)
    }
  }

  const listingsToImport = parsed.listings.filter((listing) => {
    if (listing.status === 'publish') return true
    if (includeDrafts && (listing.status === 'draft' || listing.status === 'pending')) return true
    return false
  })

  const mediaImporter = new MediaImporter({ uploadSubdir: LISTING_MEDIA_DIR })
  const allUrls = new Set<string>()
  for (const att of parsed.attachments) {
    if (att.attachmentUrl) allUrls.add(att.attachmentUrl)
  }
  for (const listing of listingsToImport) {
    for (const url of collectMediaUrlsForListing(listing, attachmentById, parsed.siteUrl)) {
      allUrls.add(url)
    }
  }

  await mediaImporter.importMany([...allUrls])
  const urlMap = mediaImporter.getStats().cache
  result.mediaDownloaded = mediaImporter.getStats().downloaded
  result.mediaFailed = mediaImporter.getStats().failed

  const createdCategories = new Set<string>()

  for (const listing of listingsToImport) {
    try {
      let slug = listing.slug?.trim()
      if (!slug || !isValidSlug(slug)) {
        slug = slugify(listing.title || '')
      }
      if (!slug || !isValidSlug(slug)) {
        result.listingsFailed += 1
        result.errors.push(`Skipped "${listing.title}": invalid slug.`)
        continue
      }

      const existing = await db.listing.findUnique({ where: { slug } })
      if (existing && skipExisting) {
        result.listingsSkipped += 1
        continue
      }

      const categoryRef = pickListingCategory(listing.categories)
      const { categoryId, schemaType } = await ensureCategory(categoryRef, createdCategories)

      const address =
        listing.meta.get('_job_location')?.trim() ||
        listing.meta.get('_job_location_friendly')?.trim() ||
        'Agadir, Morocco'

      const addressParts = parseAddressParts(address)
      const description = rewriteMediaUrls(listing.content?.trim() || `<p>${listing.title}</p>`, urlMap)
      const { image, gallery, logo } = buildImageFields(listing, attachmentById, urlMap)

      const openingHoursRows = parseJobHours(listing.meta.get('_job_hours'))
      const rating = Number.parseFloat(listing.meta.get('_average_rating') || '0') || 0
      const featured = listing.meta.get('_featured') === '1'

      const data = {
        name: listing.title.trim() || slug,
        slug,
        description,
        address,
        phone: listing.meta.get('_job_phone')?.trim() || null,
        website: sanitizeWebsite(listing.meta.get('_job_website')),
        email: listing.meta.get('_job_email')?.trim() || null,
        image,
        gallery,
        logo,
        rating: Math.min(5, Math.max(0, rating)),
        reviewCount: 0,
        featured,
        published: listing.status === 'publish',
        categoryId,
        city: addressParts.city,
        region: null,
        postalCode: addressParts.postalCode,
        country: listing.meta.get('country')?.trim() === 'Morocco' ? 'MA' : addressParts.country,
        latitude: parseCoordinate(listing.meta.get('geolocation_lat')),
        longitude: parseCoordinate(listing.meta.get('geolocation_long')),
        openingHours: openingHoursRows.length > 0 ? JSON.stringify(openingHoursRows) : null,
        priceRange: mapPriceRange(listing.meta.get('_job_price_range')),
        seoTitle: listing.meta.get('_aioseo_title')?.trim() || listing.title.trim() || null,
        metaDescription:
          listing.meta.get('_aioseo_description')?.trim() ||
          listing.meta.get('_job_tagline')?.trim() ||
          null,
        metaKeywords: listing.meta.get('_aioseo_keywords')?.trim() || null,
        canonicalUrl: null, // self-canonical to /listing/<slug>, not the old WP /job/ URL
        schemaType,
      }

      if (existing) {
        await db.listing.update({ where: { id: existing.id }, data })
      } else {
        await db.listing.create({ data })
      }

      result.listingsImported += 1
    } catch (error) {
      result.listingsFailed += 1
      const message = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(`Failed "${listing.title}": ${message}`)
    }
  }

  result.categoriesCreated = createdCategories.size
  if (result.errors.length > 20) {
    result.errors = [
      ...result.errors.slice(0, 20),
      `…and ${result.errors.length - 20} more errors`,
    ]
  }

  return result
}
