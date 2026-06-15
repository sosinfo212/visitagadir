import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      totalUsers,
      totalSearches,
      searchesLast7Days,
      searchEvents,
      categoryEvents,
      topRatedListings,
      mostReviewedListings,
      categoriesWithCounts,
      recentSearches,
    ] = await Promise.all([
      db.user.count(),
      db.searchEvent.count(),
      db.searchEvent.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.searchEvent.findMany({
        where: { query: { not: null } },
        select: { query: true },
      }),
      db.searchEvent.findMany({
        where: { categorySlug: { not: null } },
        select: { categorySlug: true },
      }),
      db.listing.findMany({
        take: 10,
        orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
        include: { category: { select: { name: true, slug: true } } },
      }),
      db.listing.findMany({
        take: 10,
        orderBy: [{ reviewCount: 'desc' }, { rating: 'desc' }],
        include: { category: { select: { name: true, slug: true } } },
      }),
      db.category.findMany({
        include: { _count: { select: { listings: true } } },
        orderBy: { listings: { _count: 'desc' } },
      }),
      db.searchEvent.findMany({
        where: { query: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { query: true, categorySlug: true, createdAt: true },
      }),
    ])

    const searchTermCounts = new Map<string, number>()
    for (const event of searchEvents) {
      const term = event.query?.trim().toLowerCase()
      if (!term) continue
      searchTermCounts.set(term, (searchTermCounts.get(term) || 0) + 1)
    }
    const topSearchTerms = [...searchTermCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([term, count]) => ({ term, count }))

    const categoryBrowseCounts = new Map<string, number>()
    for (const event of categoryEvents) {
      const slug = event.categorySlug?.trim()
      if (!slug) continue
      categoryBrowseCounts.set(slug, (categoryBrowseCounts.get(slug) || 0) + 1)
    }
    const topBrowsedCategories = [...categoryBrowseCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([slug, count]) => ({ slug, count }))

    const categoryNames = Object.fromEntries(categoriesWithCounts.map((c) => [c.slug, c.name]))

    return NextResponse.json({
      overview: {
        totalUsers,
        totalSearches,
        searchesLast7Days,
        totalListings: categoriesWithCounts.reduce((sum, c) => sum + c._count.listings, 0),
      },
      topSearchTerms,
      topBrowsedCategories: topBrowsedCategories.map((item) => ({
        ...item,
        name: categoryNames[item.slug] || item.slug,
      })),
      topRatedBusinesses: topRatedListings.map((l) => ({
        id: l.id,
        name: l.name,
        slug: l.slug,
        rating: l.rating,
        reviewCount: l.reviewCount,
        category: l.category.name,
        featured: l.featured,
      })),
      mostReviewedBusinesses: mostReviewedListings.map((l) => ({
        id: l.id,
        name: l.name,
        slug: l.slug,
        rating: l.rating,
        reviewCount: l.reviewCount,
        category: l.category.name,
      })),
      popularCategories: categoriesWithCounts.slice(0, 10).map((c) => ({
        name: c.name,
        slug: c.slug,
        listingCount: c._count.listings,
        browseCount: categoryBrowseCounts.get(c.slug) || 0,
      })),
      recentSearches,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
