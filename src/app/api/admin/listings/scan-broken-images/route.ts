import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import {
  findBrokenImages,
  listingHasImageProblems,
  listingImagesFromRecord,
} from '@/lib/listing-image-health'

const LISTING_BATCH_SIZE = 8

export async function POST() {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const listings = await db.listing.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        gallery: true,
        published: true,
      },
      orderBy: { name: 'asc' },
    })

    const affected: Array<{
      id: string
      name: string
      slug: string
      brokenUrls: string[]
      imageCount: number
      wasPublished: boolean
      drafted: boolean
    }> = []

    let scanned = 0
    let drafted = 0

    for (let i = 0; i < listings.length; i += LISTING_BATCH_SIZE) {
      const batch = listings.slice(i, i + LISTING_BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(async (listing) => {
          const images = listingImagesFromRecord(listing.image, listing.gallery)
          const brokenUrls = await findBrokenImages(images)
          const hasProblems = listingHasImageProblems(images, brokenUrls)
          return { listing, images, brokenUrls, hasProblems }
        }),
      )

      for (const { listing, images, brokenUrls, hasProblems } of batchResults) {
        scanned += 1
        if (!hasProblems) continue

        let draftedNow = false
        if (listing.published) {
          await db.listing.update({
            where: { id: listing.id },
            data: { published: false },
          })
          drafted += 1
          draftedNow = true
        }

        affected.push({
          id: listing.id,
          name: listing.name,
          slug: listing.slug,
          brokenUrls,
          imageCount: images.length,
          wasPublished: listing.published,
          drafted: draftedNow,
        })
      }
    }

    return NextResponse.json({
      scanned,
      affectedCount: affected.length,
      drafted,
      affected,
      message:
        affected.length === 0
          ? 'No listings with broken or missing images found.'
          : `Moved ${drafted} listing${drafted === 1 ? '' : 's'} to drafts (${affected.length} with image issues).`,
    })
  } catch (error) {
    console.error('Scan broken listing images error:', error)
    return NextResponse.json({ error: 'Failed to scan listing images' }, { status: 500 })
  }
}
