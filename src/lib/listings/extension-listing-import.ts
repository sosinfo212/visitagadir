import path from 'path'
import { db } from '@/lib/db'
import { MediaImporter } from '@/lib/blog/import-media'
import { splitImagesForStorage } from '@/lib/listing-images'
import { buildListingPayload, type ListingPayloadInput } from '@/lib/listing-payload'
import { resolveUploadDir } from '@/lib/upload-paths'

const LISTING_MEDIA_DIR = resolveUploadDir('listings', 'imported')

export interface ExtensionReviewInput {
  authorName: string
  rating: number
  comment: string
}

export interface ExtensionImportInput extends ListingPayloadInput {
  name: string
  description: string
  address: string
  categoryId: string
  slug?: string
  /** Remote image URLs to download server-side (may fail for Google CDN). */
  imageUrls?: string[]
  /** Already-uploaded local paths from POST /api/extension/upload */
  images?: string[]
  logoUrl?: string | null
  reviews?: ExtensionReviewInput[]
  /** Google Maps place URL or place_id canonical link. */
  googleMapsUrl?: string | null
  /** Keep aggregate Google rating/count on listing header when reviews are imported. */
  googleRating?: number | null
  googleReviewCount?: number | null
  published?: boolean
}

export interface ExtensionImportResult {
  listingId: string
  slug: string
  imagesDownloaded: number
  imagesFailed: number
  reviewsCreated: number
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base
  let n = 0
  while (await db.listing.findUnique({ where: { slug } })) {
    n += 1
    slug = `${base}-${n}`
  }
  return slug
}

export async function importListingFromExtension(
  input: ExtensionImportInput,
): Promise<ExtensionImportResult> {
  const category = await db.category.findUnique({ where: { id: input.categoryId } })
  if (!category) {
    throw new Error('Category not found')
  }

  const remoteUrls = [
    ...(input.imageUrls ?? []),
    ...(input.logoUrl ? [input.logoUrl] : []),
  ].filter((u) => typeof u === 'string' && u.startsWith('http'))

  const importer = new MediaImporter({ uploadSubdir: LISTING_MEDIA_DIR })
  let localImages: string[] = []

  if (Array.isArray(input.images) && input.images.length > 0) {
    localImages = input.images.filter((u) => typeof u === 'string' && u.startsWith('/uploads/'))
  } else if (remoteUrls.length > 0) {
    await importer.importMany(remoteUrls)
    const urlMap = importer.getStats().cache
    localImages = (input.imageUrls ?? [])
      .map((u) => urlMap.get(u.trim()))
      .filter((u): u is string => Boolean(u))
  }

  const urlMap = importer.getStats().cache

  const logo = input.logoUrl ? urlMap.get(input.logoUrl.trim()) ?? null : null
  const split = localImages.length > 0 ? splitImagesForStorage(localImages) : { image: null, gallery: null }

  const baseSlug = input.slug?.trim() || slugifyName(input.name)
  const slug = await uniqueSlug(baseSlug || `listing-${Date.now().toString(36)}`)

  const payload = buildListingPayload({
    ...input,
    image: split.image ?? input.image,
    images: split.image
      ? [split.image, ...(split.gallery ? JSON.parse(split.gallery) : [])]
      : input.images,
    logo: logo ?? input.logo ?? null,
    // Never canonicalise a listing to its Google Maps / source URL — that made
    // the page non-indexable ("canonicalised" to google.com). Leave null so the
    // listing page self-canonicalises to /listing/<slug>.
    canonicalUrl: null,
    published: input.published !== false,
  })

  const googleRating = input.googleRating ?? input.rating
  const googleReviewCount = input.googleReviewCount ?? input.reviewCount
  const validReviewInputs = (input.reviews ?? []).filter((r) => {
    const authorName = r.authorName?.trim()
    const comment = r.comment?.trim()
    return authorName && comment && comment.length >= 5
  })
  const importedReviewCount = validReviewInputs.length
  const listingReviewCount = Math.max(
    importedReviewCount,
    typeof googleReviewCount === 'number' ? googleReviewCount : 0,
  )

  const listing = await db.listing.create({
    data: {
      ...(payload as Parameters<typeof db.listing.create>[0]['data']),
      slug,
      rating: typeof googleRating === 'number' ? googleRating : 0,
      reviewCount: listingReviewCount,
    },
  })

  let reviewsCreated = 0
  for (const review of validReviewInputs) {
    const authorName = review.authorName!.trim()
    const comment = review.comment!.trim()
    const rating = Math.min(5, Math.max(1, Math.round(Number(review.rating))))
    await db.review.create({
      data: {
        listingId: listing.id,
        authorName,
        rating,
        comment,
        approved: true,
      },
    })
    reviewsCreated += 1
  }

  const stats = importer.getStats()
  const imagesDownloaded = localImages.length > 0 && input.images?.length
    ? localImages.length
    : stats.downloaded

  return {
    listingId: listing.id,
    slug: listing.slug,
    imagesDownloaded,
    imagesFailed: stats.failed,
    reviewsCreated,
  }
}
