import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { getInternalLinkingPreview } from '@/lib/seo/service'

export async function GET() {
  const authed = await isAuthenticated()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getInternalLinkingPreview())
}
