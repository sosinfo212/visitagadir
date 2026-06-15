import { db } from '@/lib/db'
import { isAuthenticated } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

// Defaults seeded on first admin visit so the page is never empty.
// Admin can edit pixelId / enable / disable them right away.
const DEFAULT_PIXELS = [
  { type: 'facebook',    name: 'Facebook Pixel',           pixelId: '',  enabled: false, position: 1 },
  { type: 'tiktok',      name: 'TikTok Pixel',             pixelId: '',  enabled: false, position: 2 },
  { type: 'ga4',         name: 'Google Analytics (GA4)',   pixelId: '',  enabled: false, position: 3 },
  { type: 'gtm',         name: 'Google Tag Manager',       pixelId: '',  enabled: false, position: 4 },
  { type: 'gsc',         name: 'Google Search Console',    pixelId: '',  enabled: false, position: 5 },
]

const ALLOWED_TYPES = new Set([
  'facebook', 'tiktok', 'ga4', 'gtm', 'gsc', 'custom_head', 'custom_body',
])

export async function GET() {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let pixels = await db.trackingPixel.findMany({ orderBy: { position: 'asc' } })

    if (pixels.length === 0) {
      await db.trackingPixel.createMany({ data: DEFAULT_PIXELS })
      pixels = await db.trackingPixel.findMany({ orderBy: { position: 'asc' } })
    }

    return NextResponse.json(pixels)
  } catch (error) {
    console.error('Error fetching pixels:', error)
    return NextResponse.json({ error: 'Failed to fetch pixels' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, name, pixelId, customCode, enabled, position } = body

    if (!type || !name) {
      return NextResponse.json({ error: 'type and name are required' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: `Invalid type. Allowed: ${[...ALLOWED_TYPES].join(', ')}` }, { status: 400 })
    }

    const pixel = await db.trackingPixel.create({
      data: {
        type,
        name,
        pixelId: pixelId || null,
        customCode: customCode || null,
        enabled: enabled ?? false,
        position: position ?? 0,
      },
    })

    return NextResponse.json(pixel, { status: 201 })
  } catch (error) {
    console.error('Error creating pixel:', error)
    return NextResponse.json({ error: 'Failed to create pixel' }, { status: 500 })
  }
}
