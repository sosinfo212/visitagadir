import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      totalListings,
      totalCategories,
      totalReviews,
      pendingSubmissions,
      avgRatingResult,
      recentSubmissions,
      recentReviews,
    ] = await Promise.all([
      db.listing.count(),
      db.category.count(),
      db.review.count(),
      db.submission.count({ where: { status: 'pending' } }),
      db.listing.aggregate({ _avg: { rating: true } }),
      db.submission.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      db.review.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            select: { name: true },
          },
        },
      }),
    ])

    return NextResponse.json({
      totalListings,
      totalCategories,
      totalReviews,
      pendingSubmissions,
      averageRating: avgRatingResult._avg.rating
        ? Math.round(avgRatingResult._avg.rating * 10) / 10
        : 0,
      recentSubmissions,
      recentReviews,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
