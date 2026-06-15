import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const settings = await db.adSettings.findFirst()
    const placements = await db.adPlacement.findMany({
      where: { enabled: true },
      orderBy: { position: 'asc' },
    })

    return NextResponse.json({
      adsEnabled: settings?.adsEnabled ?? true,
      publisherId: settings?.publisherId ?? 'ca-pub-XXXXXXXXXXXXXXXX',
      showPlaceholders: settings?.showPlaceholders ?? false,
      placements: placements.map(p => ({
        id: p.id,
        name: p.name,
        location: p.location,
        slotId: p.slotId,
        format: p.format,
        adType: p.adType,
        customHtml: p.customHtml,
      })),
    })
  } catch (error) {
    console.error('Error fetching public ads config:', error)
    return NextResponse.json({
      adsEnabled: true,
      publisherId: 'ca-pub-XXXXXXXXXXXXXXXX',
      showPlaceholders: false,
      placements: [],
    })
  }
}
