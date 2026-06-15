import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { updateRedirect, deleteRedirect } from '@/lib/seo/repository'

const ALLOWED_STATUS = [301, 302, 307, 308]

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authed = await isAuthenticated()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: { source?: string; destination?: string; statusCode?: number; enabled?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const patch: Parameters<typeof updateRedirect>[1] = {}
  if (body.source !== undefined) patch.source = String(body.source).trim()
  if (body.destination !== undefined) patch.destination = String(body.destination).trim()
  if (body.statusCode !== undefined) {
    if (!ALLOWED_STATUS.includes(body.statusCode)) {
      return NextResponse.json({ error: `statusCode must be one of ${ALLOWED_STATUS.join(',')}` }, { status: 400 })
    }
    patch.statusCode = body.statusCode
  }
  if (body.enabled !== undefined) patch.enabled = !!body.enabled

  try {
    const row = await updateRedirect(id, patch)
    return NextResponse.json(row)
  } catch {
    return NextResponse.json({ error: 'Failed to update redirect' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authed = await isAuthenticated()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    await deleteRedirect(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete redirect' }, { status: 500 })
  }
}
