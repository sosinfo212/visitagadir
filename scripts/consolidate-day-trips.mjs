/**
 * Day-trips cannibalization consolidation (Option B).
 * Canonical pillar = magical-day-trips-from-agadir-... (24.7KB, GSC p4.7).
 * Unpublish the 4 overlapping posts (301s to canonical live in next.config
 * BLOG_CONSOLIDATION) and repoint the one internal link that targeted my
 * mistaken new post. Idempotent. Rebuild after.
 *
 * Kept separate (distinct intent): best-day-trips-taroudant,
 * agadir-travel-guide-beaches-food-day-trips.
 */
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const CANONICAL = 'magical-day-trips-from-agadir-your-ultimate-guide-to-southern-morocco-2026'
const UNPUBLISH = [
  'top-day-trips-from-agadir-explore-moroccos-hidden-gems',
  'discover-the-best-day-trips-from-agadir-a-travelers-guide',
  'agadir-day-trips',
  'best-day-trips-from-agadir', // my mistaken new one
]

async function main() {
  for (const slug of UNPUBLISH) {
    const row = await db.blogPost.findUnique({ where: { slug }, select: { status: true } })
    if (!row) { console.log(`SKIP (not found): ${slug}`); continue }
    await db.blogPost.update({ where: { slug }, data: { status: 'draft' } })
    console.log(`unpublished: ${slug} (was ${row.status})`)
  }

  // Repoint the internal link in the worth-visiting post to the canonical pillar.
  const wv = await db.blogPost.findUnique({ where: { slug: 'is-agadir-worth-visiting-safe' }, select: { content: true } })
  if (wv && wv.content.includes('/blog/best-day-trips-from-agadir')) {
    const fixed = wv.content.replaceAll('/blog/best-day-trips-from-agadir', `/blog/${CANONICAL}`)
    await db.blogPost.update({ where: { slug: 'is-agadir-worth-visiting-safe' }, data: { content: fixed } })
    console.log('repointed is-agadir-worth-visiting-safe internal link → canonical')
  }
  console.log('\nDone. Rebuild: bash scripts/safe-deploy.sh')
}
main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
