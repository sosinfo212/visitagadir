/**
 * One-off migration: move inline base64 image data out of the DB and onto disk.
 *
 * Targets Listing.image (data: URI) and Listing.gallery (JSON array that may
 * contain data: URIs). Decodes each blob, writes it under
 * public/uploads/listings/migrated/, and replaces the column value with the
 * public path. Non-data entries (existing /uploads or http URLs) are kept.
 *
 * Why: base64 columns inflate every list/detail query and render inline into
 * HTML (>15MB pages → Googlebot truncates; see SEO issue "HTML over 15MB").
 *
 * Usage (run from the app dir so Prisma picks up .env):
 *   node scripts/migrate-base64-images.mjs --dry   # report only, no writes
 *   node scripts/migrate-base64-images.mjs         # perform migration
 */

import { PrismaClient } from '@prisma/client'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

const DRY = process.argv.includes('--dry')
const UPLOAD_ROOT = process.env.UPLOAD_ROOT || '/var/www/visitagadir/public/uploads'
const OUT_DIR = path.join(UPLOAD_ROOT, 'listings', 'migrated')
const PUBLIC_PREFIX = '/uploads/listings/migrated'

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
}

const prisma = new PrismaClient()

function parseDataUri(s) {
  const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(s)
  if (!m) return null
  const mime = m[1].toLowerCase()
  const isB64 = !!m[2]
  const raw = m[3]
  let buf
  try {
    buf = isB64 ? Buffer.from(raw, 'base64') : Buffer.from(decodeURIComponent(raw))
  } catch {
    return null
  }
  if (!buf || buf.length === 0) return null
  return { buf, ext: EXT_BY_MIME[mime] || 'jpg' }
}

async function saveBuf(buf, ext) {
  const name = `${Date.now()}-${crypto.randomBytes(5).toString('hex')}.${ext}`
  if (!DRY) {
    await mkdir(OUT_DIR, { recursive: true })
    await writeFile(path.join(OUT_DIR, name), buf)
  }
  return `${PUBLIC_PREFIX}/${name}`
}

const stats = { scanned: 0, imgRows: 0, imgBytes: 0, galRows: 0, galImgs: 0, galBytes: 0, updated: 0, skipped: 0 }

const listings = await prisma.listing.findMany({
  where: {
    OR: [
      { image: { startsWith: 'data:' } },
      { gallery: { contains: 'data:image' } },
    ],
  },
  select: { id: true, slug: true, image: true, gallery: true },
})

for (const l of listings) {
  stats.scanned++
  const patch = {}

  if (l.image && l.image.startsWith('data:')) {
    const p = parseDataUri(l.image)
    if (p) {
      stats.imgRows++
      stats.imgBytes += p.buf.length
      patch.image = await saveBuf(p.buf, p.ext)
    } else {
      stats.skipped++
    }
  }

  if (l.gallery && l.gallery.includes('data:image')) {
    let arr = null
    try { arr = JSON.parse(l.gallery) } catch { arr = null }
    if (Array.isArray(arr)) {
      let changed = false
      const out = []
      for (const item of arr) {
        if (typeof item === 'string' && item.startsWith('data:')) {
          const p = parseDataUri(item)
          if (p) {
            stats.galImgs++
            stats.galBytes += p.buf.length
            out.push(await saveBuf(p.buf, p.ext))
            changed = true
            continue
          }
        }
        out.push(item)
      }
      if (changed) {
        stats.galRows++
        patch.gallery = out.length > 0 ? JSON.stringify(out) : null
      }
    }
  }

  if (Object.keys(patch).length > 0) {
    if (!DRY) await prisma.listing.update({ where: { id: l.id }, data: patch })
    stats.updated++
  }
}

console.log(JSON.stringify({
  mode: DRY ? 'DRY-RUN (no writes)' : 'APPLIED',
  ...stats,
  imgMB: (stats.imgBytes / 1e6).toFixed(1),
  galMB: (stats.galBytes / 1e6).toFixed(1),
  totalMB: ((stats.imgBytes + stats.galBytes) / 1e6).toFixed(1),
}, null, 2))

await prisma.$disconnect()
