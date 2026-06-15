import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { sendNewReviewNotification } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 })
    }

    // Only return APPROVED reviews to the public
    const reviews = await db.review.findMany({
      where: { listingId, approved: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingId, authorName, rating, comment } = body

    // Validate required fields
    if (!listingId || !authorName || !rating || !comment) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Validate rating range
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Validate authorName length
    if (typeof authorName !== 'string' || authorName.trim().length < 2) {
      return NextResponse.json({ error: 'Author name must be at least 2 characters' }, { status: 400 })
    }

    // Validate comment length
    if (typeof comment !== 'string' || comment.trim().length < 5) {
      return NextResponse.json({ error: 'Comment must be at least 5 characters' }, { status: 400 })
    }

    // Create the review as NOT approved — needs admin approval
    const review = await db.review.create({
      data: {
        authorName: authorName.trim(),
        rating,
        comment: comment.trim(),
        listingId,
        approved: false,
      },
    })

    // Notify listing owner by email (non-blocking)
    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: {
        name: true,
        slug: true,
        userId: true,
        user: { select: { email: true, name: true } },
      },
    })

    if (listing?.user?.email) {
      void sendNewReviewNotification({
        ownerEmail: listing.user.email,
        ownerName: listing.user.name,
        listingName: listing.name,
        listingSlug: listing.slug,
        authorName: authorName.trim(),
        rating,
        comment: comment.trim(),
      })
    }

    // Recalculate the listing's average rating based on APPROVED reviews only
    const approvedReviews = await db.review.findMany({
      where: { listingId, approved: true },
    })
    const approvedCount = approvedReviews.length
    const avgRating = approvedCount > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedCount
      : 0

    await db.listing.update({
      where: { id: listingId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: approvedCount,
      },
    })

    return NextResponse.json({ ...review, pendingApproval: true }, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
