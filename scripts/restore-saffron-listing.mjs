/**
 * Restore the accidentally-unpublished Saffron Restaurant listing.
 *
 * On 2026-09-07 `saffron-restaurant-mqmy5005` was set published=0. It is the
 * site's #1 keyword page (GSC: ~44 clicks / 1,755 impr / pos 3.7 for
 * "saffron agadir" + "saffron restaurant agadir menu"), so the URL 404ing is
 * actively bleeding traffic. This republishes it (slug unchanged, so the
 * ranking URL resolves again).
 *
 * PREFER the admin panel (Listings → Saffron Restaurant → Published → Save):
 * the admin save route triggers cache revalidation, so it goes live instantly.
 * This script only flips the DB flag — after running it you MUST rebuild
 * (bash scripts/safe-deploy.sh) or wait for the 1h ISR window, otherwise the
 * listing page keeps serving its cached 404.
 *
 * Run on the server:  node scripts/restore-saffron-listing.mjs
 * Idempotent.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const SLUG = 'saffron-restaurant-mqmy5005'

async function main() {
  const before = await db.listing.findUnique({
    where: { slug: SLUG },
    select: { id: true, name: true, slug: true, published: true },
  })
  if (!before) {
    console.error(`NOT FOUND: no listing with slug ${SLUG}. Aborting (nothing to restore).`)
    process.exit(1)
  }
  console.log('Before:', before)

  if (before.published) {
    console.log('Already published — no change needed.')
    return
  }

  await db.listing.update({ where: { slug: SLUG }, data: { published: true } })
  const after = await db.listing.findUnique({
    where: { slug: SLUG },
    select: { name: true, slug: true, published: true },
  })
  console.log('After :', after)
  console.log('Republished. NOW rebuild to clear the cached 404: bash scripts/safe-deploy.sh')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
