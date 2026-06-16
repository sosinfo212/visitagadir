import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { findDuplicateListingGroups } from '@/lib/listings/find-duplicates'

export async function GET() {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const listings = await db.listing.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        address: true,
        published: true,
        category: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    })

    const { groups, duplicateListingIds } = findDuplicateListingGroups(listings)

    return NextResponse.json({
      groups,
      groupCount: groups.length,
      duplicateListingCount: duplicateListingIds.size,
    })
  } catch (error) {
    console.error('Find duplicate listings error:', error)
    return NextResponse.json({ error: 'Failed to find duplicate listings' }, { status: 500 })
  }
}
