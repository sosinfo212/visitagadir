import { db } from '@/lib/db'
import { buildImagesArray } from '@/lib/listing-images'

export async function getOwnedSubmission(submissionId: string, userId: string) {
  return db.submission.findFirst({
    where: { id: submissionId, userId },
    include: {
      listing: {
        include: {
          category: { select: { name: true, slug: true, icon: true } },
          reviews: { orderBy: { createdAt: 'desc' } },
        },
      },
    },
  })
}

export async function getOwnedListing(listingId: string, userId: string) {
  return db.listing.findFirst({
    where: { id: listingId, userId },
    include: {
      category: { select: { name: true, slug: true, icon: true } },
      reviews: { orderBy: { createdAt: 'desc' } },
      submission: true,
    },
  })
}

type CategoryInfo = { name: string; slug: string }

function resolveCategoryLabel(categorySlugOrName: string, categories: CategoryInfo[]) {
  const bySlug = categories.find((c) => c.slug === categorySlugOrName)
  if (bySlug) return bySlug
  const byName = categories.find((c) => c.name === categorySlugOrName)
  if (byName) return byName
  return { name: categorySlugOrName, slug: categorySlugOrName }
}

export function serializeMyBusinessItem(
  submission: {
    id: string
    businessName: string
    description: string
    category: string
    address: string
    phone: string | null
    website: string | null
    email: string | null
    image: string | null
    gallery: string | null
    status: string
    createdAt: Date
    updatedAt: Date
    listing?: {
      id: string
      slug: string
      rating: number
      reviewCount: number
      category: { name: string; slug: string; icon: string }
      reviews: Array<{
        id: string
        authorName: string
        rating: number
        comment: string
        approved: boolean
        ownerReply: string | null
        ownerRepliedAt: Date | null
        createdAt: Date
      }>
    } | null
  },
  categories: CategoryInfo[],
) {
  const cat = resolveCategoryLabel(submission.category, categories)
  const listing = submission.listing

  return {
    id: submission.id,
    submissionId: submission.id,
    listingId: listing?.id ?? null,
    status: submission.status,
    name: submission.businessName,
    description: submission.description,
    category: listing?.category ?? cat,
    categorySlug: submission.category,
    address: submission.address,
    phone: submission.phone,
    website: submission.website,
    email: submission.email,
    images: buildImagesArray(submission.image, submission.gallery),
    slug: listing?.slug ?? null,
    rating: listing?.rating ?? 0,
    reviewCount: listing?.reviewCount ?? 0,
    reviews: listing?.reviews?.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      comment: r.comment,
      approved: r.approved,
      ownerReply: r.ownerReply,
      ownerRepliedAt: r.ownerRepliedAt,
      createdAt: r.createdAt,
    })) ?? [],
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  }
}

/** Legacy listings created before submission linking. */
export function serializeOrphanListing(listing: {
  id: string
  name: string
  slug: string
  description: string
  address: string
  phone: string | null
  website: string | null
  email: string | null
  image: string | null
  gallery: string | null
  rating: number
  reviewCount: number
  createdAt: Date
  updatedAt: Date
  category: { name: string; slug: string; icon: string }
  reviews: Array<{
    id: string
    authorName: string
    rating: number
    comment: string
    approved: boolean
    ownerReply: string | null
    ownerRepliedAt: Date | null
    createdAt: Date
  }>
}) {
  const { gallery, ...rest } = listing
  void gallery
  return {
    id: listing.id,
    submissionId: null,
    listingId: listing.id,
    status: 'approved',
    name: listing.name,
    description: listing.description,
    category: listing.category,
    categorySlug: listing.category.slug,
    address: listing.address,
    phone: listing.phone,
    website: listing.website,
    email: listing.email,
    images: buildImagesArray(listing.image, listing.gallery),
    slug: listing.slug,
    rating: listing.rating,
    reviewCount: listing.reviewCount,
    reviews: listing.reviews.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      comment: r.comment,
      approved: r.approved,
      ownerReply: r.ownerReply,
      ownerRepliedAt: r.ownerRepliedAt,
      createdAt: r.createdAt,
    })),
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  }
}

export function serializeOwnedListing(listing: {
  id: string
  name: string
  slug: string
  description: string
  address: string
  phone: string | null
  website: string | null
  email: string | null
  image: string | null
  gallery: string | null
  rating: number
  reviewCount: number
  featured: boolean
  categoryId: string
  userId: string | null
  createdAt: Date
  updatedAt: Date
  category: { name: string; slug: string; icon: string }
  reviews?: Array<{
    id: string
    authorName: string
    rating: number
    comment: string
    approved: boolean
    ownerReply: string | null
    ownerRepliedAt: Date | null
    createdAt: Date
  }>
}) {
  const { gallery, reviews, ...rest } = listing
  void gallery
  return {
    ...rest,
    images: buildImagesArray(listing.image, listing.gallery),
    reviews: reviews?.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      comment: r.comment,
      approved: r.approved,
      ownerReply: r.ownerReply,
      ownerRepliedAt: r.ownerRepliedAt,
      createdAt: r.createdAt,
    })),
  }
}
