import { db } from '@/lib/db'
import { isAuthenticated } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.slotId !== undefined) updateData.slotId = body.slotId
    if (body.format !== undefined) updateData.format = body.format
    if (body.adType !== undefined) updateData.adType = body.adType
    if (body.enabled !== undefined) updateData.enabled = body.enabled
    if (body.customHtml !== undefined) updateData.customHtml = body.customHtml
    if (body.description !== undefined) updateData.description = body.description
    if (body.position !== undefined) updateData.position = body.position
    if (body.location !== undefined) updateData.location = body.location

    const placement = await db.adPlacement.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(placement)
  } catch (error) {
    console.error('Error updating ad placement:', error)
    return NextResponse.json({ error: 'Failed to update ad placement' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await db.adPlacement.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ad placement:', error)
    return NextResponse.json({ error: 'Failed to delete ad placement' }, { status: 500 })
  }
}
