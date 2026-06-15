/**
 * Backfill listings that have no featured image with the site default placeholder.
 * Run: npx tsx scripts/backfill-listing-default-images.ts
 */
import { PrismaClient } from '@prisma/client'
import { getListingFeaturedImage, LISTING_DEFAULT_IMAGE } from '../src/lib/listing-images'

const db = new PrismaClient()

async function main() {
  const listings = await db.listing.findMany({
    select: { id: true, name: true, image: true, gallery: true },
  })

  let updated = 0
  for (const listing of listings) {
    const hasStoredImage = Boolean(listing.image?.trim())
    const resolved = getListingFeaturedImage(listing.image, listing.gallery)
    const needsDefault = !hasStoredImage && resolved === LISTING_DEFAULT_IMAGE

    if (needsDefault) {
      await db.listing.update({
        where: { id: listing.id },
        data: { image: LISTING_DEFAULT_IMAGE },
      })
      updated++
    }
  }

  console.log(`Checked ${listings.length} listings, updated ${updated} with ${LISTING_DEFAULT_IMAGE}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
