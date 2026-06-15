import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { db } from '@/lib/db'

type BulkAction = 'delete' | 'changeCategory' | 'unpublish' | 'publish'

export async function POST(request: NextRequest) {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
      : []
    const action = body.action as BulkAction

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Select at least one listing.' }, { status: 400 })
    }
    if (ids.length > 500) {
      return NextResponse.json({ error: 'Too many listings selected (max 500).' }, { status: 400 })
    }

    if (action === 'delete') {
      const result = await db.listing.deleteMany({ where: { id: { in: ids } } })
      return NextResponse.json({ success: true, affected: result.count })
    }

    if (action === 'unpublish') {
      const result = await db.listing.updateMany({
        where: { id: { in: ids } },
        data: { published: false },
      })
      return NextResponse.json({ success: true, affected: result.count })
    }

    if (action === 'publish') {
      const result = await db.listing.updateMany({
        where: { id: { in: ids } },
        data: { published: true },
      })
      return NextResponse.json({ success: true, affected: result.count })
    }

    if (action === 'changeCategory') {
      const categoryId = typeof body.categoryId === 'string' ? body.categoryId : ''
      if (!categoryId) {
        return NextResponse.json({ error: 'Choose a category first.' }, { status: 400 })
      }
      const category = await db.category.findUnique({ where: { id: categoryId } })
      if (!category) {
        return NextResponse.json({ error: 'Category not found.' }, { status: 400 })
      }
      const result = await db.listing.updateMany({
        where: { id: { in: ids } },
        data: { categoryId },
      })
      return NextResponse.json({ success: true, affected: result.count })
    }

    return NextResponse.json({ error: 'Invalid bulk action.' }, { status: 400 })
  } catch (error) {
    console.error('Bulk listings action error:', error)
    return NextResponse.json({ error: 'Bulk action failed.' }, { status: 500 })
  }
}
