import { db } from '@/lib/db'
import { isAuthenticated } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

// Default ad placements to seed
const DEFAULT_PLACEMENTS = [
  { name: 'Header Banner', location: 'header_banner', slotId: '1234567890', format: 'horizontal', adType: 'adsense', description: 'Top banner ad (728x90) below the hero section', position: 1 },
  { name: 'Featured Listings Feed', location: 'featured_feed', slotId: '2345678901', format: 'fluid', adType: 'adsense', description: 'In-feed ad after featured listings section', position: 2 },
  { name: 'Bottom Banner', location: 'bottom_banner', slotId: '3456789012', format: 'horizontal', adType: 'adsense', description: 'Bottom banner ad (728x90) below listings', position: 3 },
  { name: 'Category Page Banner', location: 'category_banner', slotId: '4567890123', format: 'horizontal', adType: 'adsense', description: 'Banner ad on category view page', position: 4 },
  { name: 'Listings Feed', location: 'listings_feed', slotId: '5678901234', format: 'fluid', adType: 'adsense', description: 'In-feed ad between listing cards', position: 5 },
  { name: 'Article Inline', location: 'article_inline', slotId: '6789012345', format: 'fluid', adType: 'adsense', description: 'Inline ad within listing detail content', position: 6 },
  { name: 'Sidebar Rectangle', location: 'sidebar_rectangle', slotId: '7890123456', format: 'rectangle', adType: 'adsense', description: 'Sidebar ad (300x250) on listing detail page', position: 7 },
]

export async function GET() {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure placements exist
    let placements = await db.adPlacement.findMany({ orderBy: { position: 'asc' } })

    if (placements.length === 0) {
      // Seed default placements
      await db.adPlacement.createMany({ data: DEFAULT_PLACEMENTS })
      placements = await db.adPlacement.findMany({ orderBy: { position: 'asc' } })
    }

    // Get or create settings
    let settings = await db.adSettings.findFirst()
    if (!settings) {
      settings = await db.adSettings.create({
        data: {
          publisherId: 'ca-pub-XXXXXXXXXXXXXXXX',
          adsEnabled: true,
          showPlaceholders: true,
        },
      })
    }

    return NextResponse.json({ placements, settings })
  } catch (error) {
    console.error('Error fetching ads:', error)
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, location, slotId, format, adType, enabled, customHtml, description, position } = body

    if (!name || !location) {
      return NextResponse.json({ error: 'Name and location are required' }, { status: 400 })
    }

    const placement = await db.adPlacement.create({
      data: {
        name,
        location,
        slotId: slotId || null,
        format: format || 'auto',
        adType: adType || 'adsense',
        enabled: enabled !== undefined ? enabled : true,
        customHtml: customHtml || null,
        description: description || null,
        position: position || 0,
      },
    })

    return NextResponse.json(placement, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'A placement with this location already exists' }, { status: 409 })
    }
    console.error('Error creating ad placement:', error)
    return NextResponse.json({ error: 'Failed to create ad placement' }, { status: 500 })
  }
}
