/**
 * One-off fix: clear stale blog canonical URLs.
 *
 * Imported posts kept their old WordPress permalink as canonicalUrl
 * (e.g. https://visitagadir.info/<slug>/ — no /blog/ prefix). Those URLs now
 * 404, so the canonical points at a non-indexable page (Screaming Frog:
 * "Canonicals: Non-Indexable Canonical"). Nulling the override makes each post
 * self-canonical to its real, indexable /blog/<slug> URL.
 *
 * Usage (from app dir):  node scripts/fix-blog-canonicals.mjs [--dry]
 */

import { PrismaClient } from '@prisma/client'

const DRY = process.argv.includes('--dry')
const prisma = new PrismaClient()

const targets = await prisma.blogPost.findMany({
  where: {
    canonicalUrl: { not: null },
    NOT: { canonicalUrl: { contains: '/blog/' } },
  },
  select: { id: true, slug: true, canonicalUrl: true },
})

// Exclude rows whose canonicalUrl is an empty string (findMany can't filter <> '')
const dirty = targets.filter((t) => (t.canonicalUrl ?? '').trim() !== '')

console.log(`${DRY ? 'DRY-RUN' : 'APPLY'}: ${dirty.length} blog posts with off-site/old canonical`)
for (const t of dirty.slice(0, 5)) console.log(`  e.g. ${t.slug} -> ${t.canonicalUrl}`)

if (!DRY) {
  const ids = dirty.map((t) => t.id)
  const res = await prisma.blogPost.updateMany({
    where: { id: { in: ids } },
    data: { canonicalUrl: null },
  })
  console.log(`Updated ${res.count} rows (canonicalUrl -> NULL).`)
}

await prisma.$disconnect()
