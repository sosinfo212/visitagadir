import { splitImagesForStorage } from '@/lib/listing-images'

export interface OwnerSubmissionInput {
  businessName?: string
  description?: string
  category?: string
  address?: string
  phone?: string | null
  website?: string | null
  email?: string | null
  images?: unknown
  image?: string | null
}

export function buildOwnerSubmissionPayload(body: OwnerSubmissionInput): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  if (body.businessName !== undefined) out.businessName = String(body.businessName).trim()
  if (body.description !== undefined) out.description = String(body.description).trim()
  if (body.category !== undefined) out.category = String(body.category).trim()
  if (body.address !== undefined) out.address = String(body.address).trim()

  for (const f of ['phone', 'website', 'email'] as const) {
    if (body[f] !== undefined) out[f] = body[f] === '' ? null : body[f]
  }

  if (Array.isArray(body.images)) {
    const split = splitImagesForStorage(body.images)
    out.image = split.image
    out.gallery = split.gallery
  } else if (body.image !== undefined) {
    out.image = body.image || null
  }

  return out
}

/** Map submission fields to listing update payload when live. */
export function submissionToListingPayload(sub: {
  businessName: string
  description: string
  address: string
  phone: string | null
  website: string | null
  email: string | null
  image: string | null
  gallery: string | null
  category: string
}, categoryId?: string): Record<string, unknown> {
  return {
    name: sub.businessName,
    description: sub.description,
    address: sub.address,
    phone: sub.phone,
    website: sub.website,
    email: sub.email,
    image: sub.image,
    gallery: sub.gallery,
    ...(categoryId ? { categoryId } : {}),
  }
}
