import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { buildImagesArray } from '@/lib/listing-images'
import { buildListingPayload } from '@/lib/listing-payload'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const listing = await db.listing.findUnique({
      where: { id },
      include: {
        category: { select: { name: true, slug: true, icon: true, defaultSchemaType: true } },
      },
    })
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      ...listing,
      images: buildImagesArray(listing.image, listing.gallery),
    })
  } catch (error) {
    console.error('Fetch listing error:', error)
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const updateData = buildListingPayload(body)

    // Regenerate slug only when the name actually changes.
    if (typeof body.name === 'string' && body.name.trim()) {
      const existing = await db.listing.findUnique({ where: { id }, select: { name: true } })
      if (existing && existing.name !== body.name) {
        updateData.slug = body.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
      }
    }

    const listing = await db.listing.update({
      where: { id },
      data: updateData as Parameters<typeof db.listing.update>[0]['data'],
      include: {
        category: { select: { name: true, slug: true, icon: true, defaultSchemaType: true } },
      },
    })

    return NextResponse.json({
      ...listing,
      images: buildImagesArray(listing.image, listing.gallery),
    })
  } catch (error) {
    console.error('Update listing error:', error)
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    await db.listing.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete listing error:', error)
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 })
  }
}
