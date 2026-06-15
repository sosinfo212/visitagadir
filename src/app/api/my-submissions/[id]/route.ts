import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOwnedSubmission, serializeMyBusinessItem } from '@/lib/my-listings'
import { buildOwnerSubmissionPayload } from '@/lib/owner-submission-payload'

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
    }

    const { id } = await params
    const existing = await getOwnedSubmission(id, session.user.id)
    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (existing.status === 'approved' && !existing.listing) {
      return NextResponse.json(
        { error: 'This listing is approved but not yet published. Contact support.' },
        { status: 400 },
      )
    }

    const body = await request.json()
    const updateData = buildOwnerSubmissionPayload({
      businessName: body.name ?? body.businessName,
      description: body.description,
      category: body.category ?? body.categorySlug,
      address: body.address,
      phone: body.phone,
      website: body.website,
      email: body.email,
      images: body.images,
      image: body.image,
    })

    if (updateData.businessName !== undefined && !String(updateData.businessName).trim()) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
    }
    if (updateData.description !== undefined && !String(updateData.description).trim()) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 })
    }
    if (updateData.address !== undefined && !String(updateData.address).trim()) {
      return NextResponse.json({ error: 'Address is required.' }, { status: 400 })
    }

    const needsReview =
      existing.status === 'rejected' || existing.status === 'approved'

    const statusUpdate = needsReview ? { status: 'pending' as const } : {}

    const updatedSubmission = await db.submission.update({
      where: { id },
      data: { ...updateData, ...statusUpdate },
      include: {
        listing: {
          include: {
            category: { select: { name: true, slug: true, icon: true } },
            reviews: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    })

    // Live listing is only updated when admin approves — not on owner edit.
    const categories = await db.category.findMany({ select: { name: true, slug: true } })
    const refreshed = await getOwnedSubmission(id, session.user.id)
    if (!refreshed) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json(serializeMyBusinessItem(refreshed, categories))
  } catch (error) {
    console.error('Update submission error:', error)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
    }

    const { id } = await params
    const existing = await getOwnedSubmission(id, session.user.id)
    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (existing.listing) {
      await db.listing.delete({ where: { id: existing.listing.id } })
    }

    await db.submission.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete submission error:', error)
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 })
  }
}
