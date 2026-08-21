import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const categories = await db.category.findMany({
      // Explicit select — the nav/footer only need identity + icon + count.
      // Skips `image` (MEDIUMTEXT) and SEO override columns.
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true,
        _count: {
          select: { listings: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    const res = NextResponse.json(categories)
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return res
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
