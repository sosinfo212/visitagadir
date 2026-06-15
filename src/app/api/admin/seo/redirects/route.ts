import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { createRedirect, listRedirects } from '@/lib/seo/repository'

const ALLOWED_STATUS = [301, 302, 307, 308]

export async function GET() {
  const authed = await isAuthenticated()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await listRedirects()
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const authed = await isAuthenticated()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { source?: string; destination?: string; statusCode?: number; enabled?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const source = String(body.source || '').trim()
  const destination = String(body.destination || '').trim()
  const statusCode = body.statusCode ?? 301
  const enabled = body.enabled ?? true

  if (!source) return NextResponse.json({ error: 'source is required' }, { status: 400 })
  if (!destination) return NextResponse.json({ error: 'destination is required' }, { status: 400 })
  if (!ALLOWED_STATUS.includes(statusCode)) {
    return NextResponse.json({ error: `statusCode must be one of ${ALLOWED_STATUS.join(',')}` }, { status: 400 })
  }
  if (source === destination) {
    return NextResponse.json({ error: 'source and destination cannot be identical' }, { status: 400 })
  }

  try {
    const row = await createRedirect({ source, destination, statusCode, enabled })
    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error && e.message.includes('Unique')
      ? 'A redirect for this source already exists'
      : 'Failed to create redirect'
    return NextResponse.json({ error: msg }, { status: 409 })
  }
}
