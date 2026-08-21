import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { buildCategoryPayload } from '@/lib/listing-payload'
import { revalidateCategory } from '@/lib/revalidate'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const updateData = buildCategoryPayload(body)

    const category = await db.category.update({
      where: { id },
      data: updateData as Parameters<typeof db.category.update>[0]['data'],
      include: {
        _count: { select: { listings: true } },
      },
    })

    revalidateCategory(category.slug)

    return NextResponse.json(category)
  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check how many listings will be deleted
    const listingCount = await db.listing.count({
      where: { categoryId: id },
    })

    const doomed = await db.category.findUnique({ where: { id }, select: { slug: true } })

    // Delete the category (cascade will delete listings)
    await db.category.delete({ where: { id } })

    revalidateCategory(doomed?.slug)

    return NextResponse.json({ success: true, deletedListings: listingCount })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
