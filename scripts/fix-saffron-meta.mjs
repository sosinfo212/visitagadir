/**
 * Fix the Saffron Restaurant listing's meta description.
 *
 * Its metaDescription currently contains ANOTHER restaurant's text
 * ("Visit Restaurant Côté Plage on Boulevard du 20 Août…") — a copy-paste
 * error on the site's #1 keyword page, which misleads searchers and hurts CTR
 * for "saffron restaurant agadir". Replace it with an accurate, keyword-first
 * description. (seoTitle is already correct, left untouched.)
 *
 * Run on the server:  node scripts/fix-saffron-meta.mjs   (idempotent)
 * Revalidate after: edit+save in admin, OR bash scripts/safe-deploy.sh, OR wait
 * the 1h ISR window — otherwise the listing page serves the old cached meta.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const SLUG = 'saffron-restaurant-mqmy5005'
const META =
  'Saffron Restaurant Agadir serves authentic Indian, Pakistani & Desi cuisine on the Promenade Tawada beachfront. See the menu, opening hours, location & reviews.'

async function main() {
  const before = await db.listing.findUnique({
    where: { slug: SLUG },
    select: { name: true, metaDescription: true },
  })
  if (!before) { console.error('Saffron listing not found — aborting.'); process.exit(1) }
  console.log('Before metaDescription:', JSON.stringify(before.metaDescription))
  await db.listing.update({ where: { slug: SLUG }, data: { metaDescription: META } })
  console.log('After  metaDescription:', JSON.stringify(META))
  console.log('Done. Revalidate (admin save / safe-deploy / 1h ISR) to publish.')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
