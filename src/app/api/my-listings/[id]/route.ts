import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  getOwnedListing,
  serializeMyBusinessItem,
  serializeOwnedListing,
} from '@/lib/my-listings'
import { buildOwnerSubmissionPayload } from '@/lib/owner-submission-payload'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
    }

    const { id } = await params
    const listing = await getOwnedListing(id, session.user.id)
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    return NextResponse.json(serializeOwnedListing(listing))
  } catch (error) {
    console.error('Get my listing error:', error)
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
    }

    const { id } = await params
    const existing = await getOwnedListing(id, session.user.id)
    if (!existing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const body = await request.json()
    const submissionUpdates = buildOwnerSubmissionPayload({
      businessName: body.name ?? body.businessName ?? existing.name,
      description: body.description ?? existing.description,
      category: body.category ?? body.categorySlug ?? existing.category.slug,
      address: body.address ?? existing.address,
      phone: body.phone !== undefined ? body.phone : existing.phone,
      website: body.website !== undefined ? body.website : existing.website,
      email: body.email !== undefined ? body.email : existing.email,
      images: body.images,
      image: body.image,
    })

    const name = String(submissionUpdates.businessName ?? existing.name).trim()
    const description = String(submissionUpdates.description ?? existing.description).trim()
    const address = String(submissionUpdates.address ?? existing.address).trim()

    if (!name) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
    }
    if (!description) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 })
    }
    if (!address) {
      return NextResponse.json({ error: 'Address is required.' }, { status: 400 })
    }

    const categories = await db.category.findMany({ select: { name: true, slug: true } })

    if (existing.submission) {
      const needsReview =
        existing.submission.status === 'rejected' || existing.submission.status === 'approved'

      await db.submission.update({
        where: { id: existing.submission.id },
        data: {
          ...submissionUpdates,
          ...(needsReview ? { status: 'pending' } : {}),
        },
      })
    } else {
      const submission = await db.submission.create({
        data: {
          businessName: name,
          description,
          category: String(submissionUpdates.category ?? existing.category.slug),
          address,
          phone:
            submissionUpdates.phone !== undefined
              ? (submissionUpdates.phone as string | null)
              : existing.phone,
          website:
            submissionUpdates.website !== undefined
              ? (submissionUpdates.website as string | null)
              : existing.website,
          email:
            submissionUpdates.email !== undefined
              ? (submissionUpdates.email as string | null)
              : existing.email,
          image:
            submissionUpdates.image !== undefined
              ? (submissionUpdates.image as string | null)
              : existing.image,
          gallery:
            submissionUpdates.gallery !== undefined
              ? (submissionUpdates.gallery as string | null)
              : existing.gallery,
          ownerName: session.user.name || session.user.email || 'Business owner',
          status: 'pending',
          userId: session.user.id,
        },
      })

      await db.listing.update({
        where: { id },
        data: { submissionId: submission.id },
      })
    }

    const refreshed = await db.submission.findFirst({
      where: { listing: { id } },
      include: {
        listing: {
          include: {
            category: { select: { name: true, slug: true, icon: true } },
            reviews: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    })

    if (!refreshed) {
      return NextResponse.json({ error: 'Failed to save changes for review.' }, { status: 500 })
    }

    return NextResponse.json(serializeMyBusinessItem(refreshed, categories))
  } catch (error) {
    console.error('Update my listing error:', error)
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
    }

    const { id } = await params
    const existing = await db.listing.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    await db.listing.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete my listing error:', error)
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 })
  }
}
