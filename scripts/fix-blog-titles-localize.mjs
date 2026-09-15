/**
 * Task 2 tail: most blog seoTitles are already localized ("in Agadir (2026)").
 * Remaining: one wrong-title BUG + a couple of unlocalized posts.
 * (The "best X near me" vanity impressions are wrong-geo and unwinnable via
 * titles, so no further title chasing there.)
 * Idempotent. Rebuild after to clear ISR.
 */
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const EDITS = {
  // BUG: seoTitle was "Moroccan Arabic Classes for Your Agadir Stay" on a seafood post.
  'best-seafood-in-essaouira': {
    seoTitle: 'Best Seafood in Essaouira (2026): Where to Eat Fresh',
    metaDescription:
      'The best seafood restaurants in Essaouira for fresh, well-priced coastal meals — where to eat, what to order and local tips near Agadir.',
  },
  // Unlocalized (seoTitle was null)
  'souss-massa-park': {
    seoTitle: 'Souss-Massa National Park near Agadir (2026): Wildlife & Visit',
    metaDescription:
      'Visit Souss-Massa National Park near Agadir: birdwatching, the bald ibis, wildlife, how to get there and what to expect on a day trip.',
  },
  // Add a freshness year to a top-target nightlife post (keeps "Agadir")
  'agadir-nightlife-where-to-go-after-dark': {
    seoTitle: 'Agadir Nightlife 2026: Best Bars & Clubs, Where to Go After Dark',
  },
}

async function main() {
  let ok = 0, skip = 0
  for (const [slug, data] of Object.entries(EDITS)) {
    const row = await db.blogPost.findUnique({ where: { slug }, select: { title: true } })
    if (!row) { console.log(`SKIP (not found): ${slug}`); skip++; continue }
    await db.blogPost.update({ where: { slug }, data })
    console.log(`OK  ${slug}  →  "${data.seoTitle}"`)
    ok++
  }
  console.log(`\nDone: ${ok} updated, ${skip} skipped. Rebuild: bash scripts/safe-deploy.sh`)
}
main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
