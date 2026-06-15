import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

type RouteParams = { params: Promise<{ id: string; reviewId: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
    }

    const { id, reviewId } = await params
    const body = await request.json()
    const reply = String(body.reply ?? '').trim()

    if (!reply) {
      return NextResponse.json({ error: 'Reply cannot be empty.' }, { status: 400 })
    }
    if (reply.length > 2000) {
      return NextResponse.json({ error: 'Reply must be 2000 characters or less.' }, { status: 400 })
    }

    const review = await db.review.findFirst({
      where: {
        id: reviewId,
        listingId: id,
        listing: { userId: session.user.id },
      },
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const updated = await db.review.update({
      where: { id: reviewId },
      data: {
        ownerReply: reply,
        ownerRepliedAt: new Date(),
      },
    })

    return NextResponse.json({
      id: updated.id,
      ownerReply: updated.ownerReply,
      ownerRepliedAt: updated.ownerRepliedAt,
    })
  } catch (error) {
    console.error('Review reply error:', error)
    return NextResponse.json({ error: 'Failed to save reply' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
    }

    const { id, reviewId } = await params

    const review = await db.review.findFirst({
      where: {
        id: reviewId,
        listingId: id,
        listing: { userId: session.user.id },
      },
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const updated = await db.review.update({
      where: { id: reviewId },
      data: {
        ownerReply: null,
        ownerRepliedAt: null,
      },
    })

    return NextResponse.json({
      id: updated.id,
      ownerReply: null,
      ownerRepliedAt: null,
    })
  } catch (error) {
    console.error('Delete review reply error:', error)
    return NextResponse.json({ error: 'Failed to remove reply' }, { status: 500 })
  }
}
