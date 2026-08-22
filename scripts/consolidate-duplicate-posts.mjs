/**
 * Tier C consolidation: unpublish 9 duplicate posts (they 301 to their pillar
 * via next.config). Unpublishing removes them from the sitemap + blog index;
 * the redirect makes the old URL resolve to the pillar. Only clear same-intent
 * duplicates — location/sub-intent-distinct posts are left published.
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// dup slug -> pillar slug (pillar kept published; dup unpublished + 301'd)
const MERGE = {
  'best-restaurants-in-agadir-2': 'best-restaurants-in-agadir',
  'best-agadir-restaurants-for-every-mood': 'best-restaurants-in-agadir',
  'savoring-agadir-a-culinary-journey-through-traditional-moroccan-cuisine': 'best-restaurants-in-agadir',
  'savoring-the-best-of-agadir-a-guide-to-the-citys-finest-restaurant-lounges': 'best-restaurants-in-agadir',
  'best-agadir-surf-spots-for-beginners': 'the-ultimate-guide-to-agadirs-best-surf-spots-for-beginners',
  'riding-the-waves-in-agadir-a-guide-to-the-best-surfing-spots': 'the-ultimate-guide-to-agadirs-best-surf-spots-for-beginners',
  'agadir-beach-clubs-guide': 'agadir-beach-clubs-review-where-to-go',
  'exploring-the-lush-greens-agadirs-top-golf-courses': 'agadir-golf-courses',
  'places-to-work-agadir': 'best-cafes-for-remote-work-in-agadir',
}

// sanity: every pillar must still be a published post
for (const pillar of new Set(Object.values(MERGE))) {
  const p = await prisma.blogPost.findUnique({ where: { slug: pillar }, select: { status: true } })
  if (!p || p.status !== 'published') { console.log('!! PILLAR NOT PUBLISHED:', pillar); process.exit(1) }
}

let n = 0
for (const dup of Object.keys(MERGE)) {
  const r = await prisma.blogPost.findUnique({ where: { slug: dup }, select: { id: true, status: true } })
  if (!r) { console.log('SKIP (missing):', dup); continue }
  if (r.status !== 'published') { console.log('already unpublished:', dup); continue }
  await prisma.blogPost.update({ where: { slug: dup }, data: { status: 'draft' } })
  n++
  console.log(`unpublished ${dup}  ->  301 ${MERGE[dup]}`)
}
console.log(`\nUnpublished ${n} duplicates. Add matching redirects in next.config, then rebuild.`)
await prisma.$disconnect()
