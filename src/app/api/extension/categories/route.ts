import { NextRequest, NextResponse } from 'next/server'
import { isExtensionAuthorized } from '@/lib/extension-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  if (!isExtensionAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const categories = await db.category.findMany({
      select: { id: true, name: true, slug: true, icon: true, defaultSchemaType: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Extension categories error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
