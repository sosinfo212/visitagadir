/**
 * Null broken canonicalUrl overrides so pages self-canonicalise.
 * Listings imported from Google Maps / WordPress stored the SOURCE url as their
 * canonical: google.com/maps/place/... (cross-domain) or /job/<slug>/ (old WP,
 * now 301s). Both make the listing "Non-Indexable / Canonicalised". Nulling the
 * override => buildMetadata emits the self-canonical /listing/<slug>.
 * Also clears any stray blog canonical that isn't under /blog/.
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const DRY = process.argv.includes('--dry')

// ── Listings ──
const badListings = await prisma.listing.findMany({
  where: {
    OR: [
      { canonicalUrl: { contains: 'google.com/maps' } },
      { canonicalUrl: { contains: '/job/' } },
    ],
  },
  select: { id: true },
})
console.log(`${DRY ? 'DRY' : 'APPLY'}: ${badListings.length} listings with Maps/job canonical`)
if (!DRY && badListings.length) {
  const r = await prisma.listing.updateMany({
    where: { id: { in: badListings.map((l) => l.id) } },
    data: { canonicalUrl: null },
  })
  console.log(`  nulled ${r.count} listing canonicals`)
}

// ── Blog posts: any canonical not under /blog/ ──
const bp = await prisma.blogPost.findMany({
  where: { canonicalUrl: { not: null }, NOT: { canonicalUrl: { contains: '/blog/' } } },
  select: { id: true, canonicalUrl: true },
})
const bpDirty = bp.filter((p) => (p.canonicalUrl ?? '').trim() !== '')
console.log(`${DRY ? 'DRY' : 'APPLY'}: ${bpDirty.length} blog posts with off-/blog/ canonical`)
if (!DRY && bpDirty.length) {
  const r = await prisma.blogPost.updateMany({
    where: { id: { in: bpDirty.map((p) => p.id) } },
    data: { canonicalUrl: null },
  })
  console.log(`  nulled ${r.count} blog canonicals`)
}

// verify remaining
const remain = await prisma.listing.count({ where: { OR: [{ canonicalUrl: { contains: 'google.com/maps' } }, { canonicalUrl: { contains: '/job/' } }] } })
console.log(`remaining bad listing canonicals: ${remain}`)
await prisma.$disconnect()
