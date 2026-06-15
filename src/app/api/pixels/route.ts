import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Public endpoint - returns only enabled pixels with the minimum data needed
// for client-side injection. Disabled pixels are filtered out server-side.
export async function GET() {
  try {
    const pixels = await db.trackingPixel.findMany({
      where: { enabled: true },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        type: true,
        pixelId: true,
        customCode: true,
      },
    })

    const res = NextResponse.json(pixels)
    // Short cache: pixels rarely change but we want admin edits to propagate quickly
    res.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120')
    return res
  } catch (error) {
    console.error('Error fetching public pixels:', error)
    return NextResponse.json([], { status: 200 })
  }
}
