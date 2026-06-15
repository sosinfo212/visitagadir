import crypto from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

const DEFAULT_UPLOAD_SUBDIR = path.join('public', 'uploads', 'blog', 'imported')
const MAX_BYTES = 15 * 1024 * 1024
const CONCURRENCY = 5

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

function guessExtension(remoteUrl: string, contentType: string | null): string {
  const fromType = contentType ? EXT_BY_TYPE[contentType.split(';')[0].trim().toLowerCase()] : null
  if (fromType) return fromType

  const pathname = new URL(remoteUrl).pathname
  const ext = pathname.split('.').pop()?.toLowerCase()
  if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return ext === 'jpeg' ? 'jpg' : ext
  }
  return 'jpg'
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').slice(0, 80)
}

export function extractMediaUrls(html: string, siteUrl?: string): string[] {
  const urls = new Set<string>()
  const host = siteUrl ? new URL(siteUrl).origin : null

  const patterns = [
    /src=["']([^"']+)["']/gi,
    /href=["']([^"']+\.(?:jpe?g|png|gif|webp|svg)(?:\?[^"']*)?)["']/gi,
    /srcset=["']([^"']+)["']/gi,
  ]

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const raw = match[1]
      if (pattern.source.includes('srcset')) {
        for (const part of raw.split(',')) {
          const url = part.trim().split(/\s+/)[0]
          if (url) urls.add(url)
        }
      } else {
        urls.add(raw)
      }
    }
  }

  return [...urls]
    .map((u) => u.trim())
    .filter(Boolean)
    .map((u) => {
      if (u.startsWith('http')) return u
      if (host && u.startsWith('/')) return `${host}${u}`
      return u
    })
    .filter((u) => u.startsWith('http'))
}

export function rewriteMediaUrls(content: string, urlMap: Map<string, string>): string {
  let out = content
  const sorted = [...urlMap.entries()].sort((a, b) => b[0].length - a[0].length)
  for (const [remote, local] of sorted) {
    out = out.split(remote).join(local)
  }
  return out
}

export class MediaImporter {
  private readonly cache = new Map<string, string>()
  private downloaded = 0
  private failed = 0
  private readonly uploadSubdir: string
  private readonly publicPathPrefix: string

  constructor(options?: { uploadSubdir?: string }) {
    const subdir = options?.uploadSubdir ?? DEFAULT_UPLOAD_SUBDIR
    this.uploadSubdir = path.isAbsolute(subdir)
      ? subdir
      : path.join(process.cwd(), subdir)
    const relative = path.relative(path.join(process.cwd(), 'public'), this.uploadSubdir)
    this.publicPathPrefix = `/${relative.split(path.sep).join('/')}`
  }

  getStats() {
    return { downloaded: this.downloaded, failed: this.failed, cache: this.cache }
  }

  async importUrl(remoteUrl: string): Promise<string | null> {
    const normalized = remoteUrl.trim()
    if (!normalized.startsWith('http')) return null

    const cached = this.cache.get(normalized)
    if (cached) return cached

    try {
      const res = await fetch(normalized, {
        headers: { 'User-Agent': 'AgadirDirectoryImporter/1.0' },
        signal: AbortSignal.timeout(45_000),
      })
      if (!res.ok) {
        this.failed += 1
        return null
      }

      const buffer = Buffer.from(await res.arrayBuffer())
      if (buffer.length === 0 || buffer.length > MAX_BYTES) {
        this.failed += 1
        return null
      }

      const contentType = res.headers.get('content-type')
      const ext = guessExtension(normalized, contentType)
      const hash = crypto.createHash('sha1').update(normalized).digest('hex').slice(0, 10)
      const basename = sanitizeFilename(path.basename(new URL(normalized).pathname) || 'image')
      const filename = `${hash}-${basename}`.replace(/\.[^.]+$/, '') + `.${ext}`

      const uploadDir = this.uploadSubdir
      await mkdir(uploadDir, { recursive: true })
      await writeFile(path.join(uploadDir, filename), buffer)

      const localUrl = `${this.publicPathPrefix}/${filename}`
      this.cache.set(normalized, localUrl)
      this.downloaded += 1
      return localUrl
    } catch {
      this.failed += 1
      return null
    }
  }

  async importMany(urls: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(urls.map((u) => u.trim()).filter((u) => u.startsWith('http')))]
    let index = 0

    async function worker(importer: MediaImporter) {
      while (index < unique.length) {
        const current = unique[index]
        index += 1
        await importer.importUrl(current)
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, unique.length) }, () => worker(this)))
    return this.cache
  }
}
