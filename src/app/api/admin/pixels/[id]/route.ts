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
    const { name, pixelId, customCode, enabled, position, type } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (pixelId !== undefined) updateData.pixelId = pixelId || null
    if (customCode !== undefined) updateData.customCode = customCode || null
    if (enabled !== undefined) updateData.enabled = enabled
    if (position !== undefined) updateData.position = position
    if (type !== undefined) updateData.type = type

    const pixel = await db.trackingPixel.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(pixel)
  } catch (error) {
    console.error('Error updating pixel:', error)
    return NextResponse.json({ error: 'Failed to update pixel' }, { status: 500 })
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
    await db.trackingPixel.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pixel:', error)
    return NextResponse.json({ error: 'Failed to delete pixel' }, { status: 500 })
  }
}
