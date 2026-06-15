import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { getAdsTxtContent, updateAdsTxtContent } from '@/lib/ads-txt'

export async function GET() {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const content = await getAdsTxtContent()
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error fetching ads.txt:', error)
    return NextResponse.json({ error: 'Failed to fetch ads.txt' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (typeof body.content !== 'string') {
      return NextResponse.json({ error: 'content must be a string' }, { status: 400 })
    }

    const content = await updateAdsTxtContent(body.content)
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error updating ads.txt:', error)
    return NextResponse.json({ error: 'Failed to update ads.txt' }, { status: 500 })
  }
}
