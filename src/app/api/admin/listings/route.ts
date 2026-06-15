import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { buildImagesArray } from '@/lib/listing-images'
import { buildListingPayload } from '@/lib/listing-payload'

export async function POST(request: NextRequest) {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, description, address, categoryId } = body
    if (!name || !description || !address || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const payload = buildListingPayload(body)
    const slug = String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36)

    const listing = await db.listing.create({
      data: {
        ...(payload as Parameters<typeof db.listing.create>[0]['data']),
        slug,
      },
      include: {
        category: { select: { name: true, slug: true, icon: true, defaultSchemaType: true } },
      },
    })

    return NextResponse.json(
      { ...listing, images: buildImagesArray(listing.image, listing.gallery) },
      { status: 201 },
    )
  } catch (error) {
    console.error('Create listing error:', error)
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('category')
    const search = searchParams.get('search')?.trim()
    const pageParam = Number(searchParams.get('page') || 1)
    const limitParam = Number(searchParams.get('limit') || 25)
    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1
    const limit = Number.isFinite(limitParam)
      ? Math.min(100, Math.max(1, Math.floor(limitParam)))
      : 25
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (categorySlug && categorySlug !== 'all') {
      const category = await db.category.findUnique({ where: { slug: categorySlug } })
      if (category) where.categoryId = category.id
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { description: { contains: search } },
        { address: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { city: { contains: search } },
      ]
    }

    const [total, listings] = await Promise.all([
      db.listing.count({ where }),
      db.listing.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true, icon: true, defaultSchemaType: true } },
        },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip,
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))

    return NextResponse.json({
      items: listings.map(l => ({
        ...l,
        images: buildImagesArray(l.image, l.gallery),
      })),
      total,
      page,
      pageSize: limit,
      totalPages,
    })
  } catch (error) {
    console.error('Fetch listings error:', error)
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}
