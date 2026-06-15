import { db } from '@/lib/db'
import { getListingDisplayImages, getListingFeaturedImage } from '@/lib/listing-images'
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const slug = searchParams.get('slug')
    const limitParam = Number(searchParams.get('limit') || DEFAULT_LIMIT)
    const offsetParam = Number(searchParams.get('offset') || 0)
    const limit = Math.min(Math.max(1, Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT), MAX_LIMIT)
    const offset = Math.max(0, Number.isFinite(offsetParam) ? offsetParam : 0)

    if (slug) {
      const listing = await db.listing.findUnique({
        where: { slug },
        include: {
          category: {
            select: { name: true, slug: true, icon: true },
          },
        },
      })
      if (!listing || !listing.published) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      }
      return NextResponse.json({
        ...listing,
        image: getListingFeaturedImage(listing.image, listing.gallery),
        images: getListingDisplayImages(listing.image, listing.gallery),
      })
    }

    const where: Record<string, unknown> = { published: true }

    if (categorySlug) {
      const category = await db.category.findUnique({
        where: { slug: categorySlug },
      })
      if (!category) {
        return NextResponse.json([])
      }
      where.categoryId = category.id
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { address: { contains: search } },
      ]
    }

    if (featured === 'true') {
      where.featured = true
    }

    const listings = await db.listing.findMany({
      where,
      include: {
        category: {
          select: { name: true, slug: true, icon: true },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { rating: 'desc' },
      ],
      take: limit,
      skip: offset,
    })

    // Fire-and-forget analytics logging
    if (search?.trim() || categorySlug) {
      db.searchEvent.create({
        data: {
          query: search?.trim() || null,
          categorySlug: categorySlug || null,
        },
      }).catch(() => { /* ignore */ })
    }

    const withImages = listings.map(l => ({
      ...l,
      image: getListingFeaturedImage(l.image, l.gallery),
      images: getListingDisplayImages(l.image, l.gallery),
    }))

    return NextResponse.json(withImages)
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}
