/**
 * Helpers for the listing image model:
 *  - `image`   = single string (featured / cover) - existing column
 *  - `gallery` = TEXT column storing a JSON-encoded array of additional images
 *
 * The API contract exposes a single ordered array `images: string[]` where
 * `images[0]` is the featured image. This module keeps that translation in
 * one place so the storage shape can evolve later (e.g. proper join table)
 * without touching every route.
 */

export function parseGallery(gallery: string | null | undefined): string[] {
  if (!gallery) return []
  try {
    const parsed = JSON.parse(gallery)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === 'string' && v.length > 0)
  } catch {
    return []
  }
}

export function buildImagesArray(
  image: string | null | undefined,
  gallery: string | null | undefined,
): string[] {
  const rest = parseGallery(gallery)
  if (image) return [image, ...rest]
  return rest
}

/**
 * Take an `images: string[]` array from a client request and split it into
 * the storage shape. Empty/whitespace strings are stripped, duplicates kept
 * (admin decides) and the first survivor becomes the featured image.
 */
export function splitImagesForStorage(images: unknown): { image: string | null; gallery: string | null } {
  if (!Array.isArray(images)) return { image: null, gallery: null }
  const clean = images
    .filter((v): v is string => typeof v === 'string')
    .map(v => v.trim())
    .filter(v => v.length > 0)

  if (clean.length === 0) return { image: null, gallery: null }
  const [first, ...rest] = clean
  return {
    image: first,
    gallery: rest.length > 0 ? JSON.stringify(rest) : null,
  }
}
