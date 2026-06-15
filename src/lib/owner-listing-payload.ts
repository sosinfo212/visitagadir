import { splitImagesForStorage } from '@/lib/listing-images'

/** Fields a business owner may edit on their own listing. */
export interface OwnerListingInput {
  name?: string
  description?: string
  address?: string
  phone?: string | null
  website?: string | null
  email?: string | null
  images?: unknown
  image?: string | null
}

export function buildOwnerListingPayload(body: OwnerListingInput): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const f of ['name', 'description', 'address'] as const) {
    if (body[f] !== undefined) out[f] = String(body[f]).trim()
  }

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
