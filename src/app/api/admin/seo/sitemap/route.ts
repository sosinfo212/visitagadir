import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import {
  getSitemapStats,
  invalidateSeoCache,
} from '@/lib/seo/service'

export async function GET() {
  const authed = await isAuthenticated()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getSitemapStats())
}

export async function POST() {
  const authed = await isAuthenticated()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await invalidateSeoCache()
  return NextResponse.json({ success: true })
}
