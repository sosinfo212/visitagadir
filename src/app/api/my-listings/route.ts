import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { serializeMyBusinessItem, serializeOrphanListing } from '@/lib/my-listings'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
    }

    const [submissions, categories, orphanListings] = await Promise.all([
      db.submission.findMany({
        where: { userId: session.user.id },
        include: {
          listing: {
            include: {
              category: { select: { name: true, slug: true, icon: true } },
              reviews: { orderBy: { createdAt: 'desc' } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      db.category.findMany({ select: { name: true, slug: true } }),
      db.listing.findMany({
        where: {
          userId: session.user.id,
          submission: null,
        },
        include: {
          category: { select: { name: true, slug: true, icon: true } },
          reviews: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    const items = [
      ...submissions.map((s) => serializeMyBusinessItem(s, categories)),
      ...orphanListings.map(serializeOrphanListing),
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return NextResponse.json(items)
  } catch (error) {
    console.error('My listings error:', error)
    return NextResponse.json({ error: 'Failed to fetch your listings' }, { status: 500 })
  }
}
