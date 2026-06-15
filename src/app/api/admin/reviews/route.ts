import { db } from '@/lib/db'
import { isAuthenticated } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') // 'pending', 'approved', or null for all

    const where: Record<string, unknown> = {}
    if (statusFilter === 'pending') {
      where.approved = false
    } else if (statusFilter === 'approved') {
      where.approved = true
    }

    const reviews = await db.review.findMany({
      where,
      include: {
        listing: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching admin reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
