import { access } from 'fs/promises'
import path from 'path'
import { LISTING_DEFAULT_IMAGE, buildImagesArray } from '@/lib/listing-images'
import { getUploadsRoot } from '@/lib/upload-paths'

const FETCH_TIMEOUT_MS = 8000

export async function isImageUrlReachable(url: string): Promise<boolean> {
  const trimmed = url.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('data:image/')) return true
  if (trimmed === LISTING_DEFAULT_IMAGE) return true

  if (trimmed.startsWith('/uploads/')) {
    const rel = trimmed.replace(/^\/uploads\//, '')
    const filePath = path.join(getUploadsRoot(), rel)
    try {
      await access(filePath)
      return true
    } catch {
      return false
    }
  }

  if (trimmed.startsWith('/')) {
    const filePath = path.join(process.cwd(), 'public', trimmed.replace(/^\//, ''))
    try {
      await access(filePath)
      return true
    } catch {
      return false
    }
  }

  if (!/^https?:\/\//i.test(trimmed)) return false

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    let res = await fetch(trimmed, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    })
    if (res.status === 405 || res.status === 501) {
      res = await fetch(trimmed, {
        method: 'GET',
        signal: controller.signal,
        headers: { Range: 'bytes=0-0' },
        redirect: 'follow',
      })
    }
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

export async function findBrokenImages(urls: string[]): Promise<string[]> {
  if (urls.length === 0) return []
  const results = await Promise.all(
    urls.map(async (url) => ({ url, ok: await isImageUrlReachable(url) })),
  )
  return results.filter((r) => !r.ok).map((r) => r.url)
}

export function listingImagesFromRecord(
  image: string | null | undefined,
  gallery: string | null | undefined,
): string[] {
  return buildImagesArray(image, gallery)
}

export function listingHasImageProblems(images: string[], brokenUrls: string[]): boolean {
  return images.length === 0 || brokenUrls.length > 0
}
