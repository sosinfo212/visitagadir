import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { db } from '@/lib/db'

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
    const { approved } = body

    if (typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'approved must be a boolean' }, { status: 400 })
    }

    // Update the review's approval status
    const review = await db.review.update({
      where: { id },
      data: { approved },
    })

    // Recalculate the listing's average rating based on APPROVED reviews only
    const approvedReviews = await db.review.findMany({
      where: { listingId: review.listingId, approved: true },
    })
    const approvedCount = approvedReviews.length
    const avgRating = approvedCount > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedCount
      : 0

    await db.listing.update({
      where: { id: review.listingId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: approvedCount,
      },
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error('Update review error:', error)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
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

    // Get the review to find the listing ID before deleting
    const review = await db.review.findUnique({
      where: { id },
      select: { listingId: true },
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Delete the review
    await db.review.delete({ where: { id } })

    // Recalculate the listing's average rating based on APPROVED reviews only
    const approvedReviews = await db.review.findMany({
      where: { listingId: review.listingId, approved: true },
    })
    const approvedCount = approvedReviews.length
    const avgRating = approvedCount > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedCount
      : 0

    await db.listing.update({
      where: { id: review.listingId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: approvedCount,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete review error:', error)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }
}
