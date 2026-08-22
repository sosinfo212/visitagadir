/**
 * Generate a default 1200x630 Open Graph / Twitter image from the hero photo
 * with a gradient + brand text, save it under public/uploads/og/, and set
 * SeoSettings.defaultOgImage. Uses sharp (already a dependency). Run on the
 * server: node scripts/make-og-image.mjs
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const ROOT = process.cwd()
const HERO = path.join(ROOT, 'public', 'agadir-hero.jpg')
const OUT_DIR = path.join(ROOT, 'public', 'uploads', 'og')
const OUT = path.join(OUT_DIR, 'default-og.jpg')
const PUBLIC_URL = '/uploads/og/default-og.jpg'
const W = 1200, H = 630

const overlaySvg = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0.15)"/>
      <stop offset="45%" stop-color="rgba(0,0,0,0.05)"/>
      <stop offset="100%" stop-color="rgba(10,10,12,0.86)"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="70" y="404" width="66" height="8" rx="4" fill="#f97316"/>
  <text x="68" y="500" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="86" font-weight="bold" fill="#ffffff">Visit Agadir</text>
  <text x="72" y="556" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-size="33" fill="#f1f1f1">Travel Guide &amp; Local Directory &#183; Agadir, Morocco</text>
</svg>`)

await mkdir(OUT_DIR, { recursive: true })

await sharp(HERO)
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .composite([{ input: overlaySvg, top: 0, left: 0 }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(OUT)

const meta = await sharp(OUT).metadata()
console.log(`OG image written: ${OUT} (${meta.width}x${meta.height})`)

const prisma = new PrismaClient()
const seo = await prisma.seoSettings.findFirst({ orderBy: { createdAt: 'asc' } })
if (seo) {
  await prisma.seoSettings.update({ where: { id: seo.id }, data: { defaultOgImage: PUBLIC_URL } })
  console.log(`SeoSettings.defaultOgImage -> ${PUBLIC_URL}`)
} else {
  console.log('No SeoSettings row!')
}
await prisma.$disconnect()
