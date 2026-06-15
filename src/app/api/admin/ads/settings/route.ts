import { db } from '@/lib/db'
import { isAuthenticated } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { publisherId, adsEnabled, showPlaceholders } = body

    let settings = await db.adSettings.findFirst()

    if (settings) {
      const updateData: Record<string, unknown> = {}
      if (publisherId !== undefined) updateData.publisherId = publisherId
      if (adsEnabled !== undefined) updateData.adsEnabled = adsEnabled
      if (showPlaceholders !== undefined) updateData.showPlaceholders = showPlaceholders

      settings = await db.adSettings.update({
        where: { id: settings.id },
        data: updateData,
      })
    } else {
      settings = await db.adSettings.create({
        data: {
          publisherId: publisherId || 'ca-pub-XXXXXXXXXXXXXXXX',
          adsEnabled: adsEnabled !== undefined ? adsEnabled : true,
          showPlaceholders: showPlaceholders !== undefined ? showPlaceholders : true,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating ad settings:', error)
    return NextResponse.json({ error: 'Failed to update ad settings' }, { status: 500 })
  }
}
