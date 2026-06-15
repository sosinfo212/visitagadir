import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { getSchemaSettings, updateSchemaSettings } from '@/lib/seo/repository'
import { parseSocialProfiles, type SocialProfile, type SocialPlatform } from '@/lib/seo/types'

/**
 * Read/write the social-profile list as a typed array. We persist it as
 * JSON in SchemaSettings.socialProfiles to avoid yet another tiny table.
 */

const ALLOWED: SocialPlatform[] = [
  'facebook', 'instagram', 'linkedin', 'youtube', 'twitter', 'tiktok', 'pinterest', 'whatsapp',
]

export async function GET() {
  const authed = await isAuthenticated()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const s = await getSchemaSettings()
  return NextResponse.json({ profiles: parseSocialProfiles(s.socialProfiles) })
}

export async function PUT(request: NextRequest) {
  const authed = await isAuthenticated()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { profiles?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!Array.isArray(body.profiles)) {
    return NextResponse.json({ error: 'profiles must be an array' }, { status: 400 })
  }

  const cleaned: SocialProfile[] = []
  for (const raw of body.profiles) {
    if (!raw || typeof raw !== 'object') continue
    const r = raw as Record<string, unknown>
    const platform = String(r.platform || '').toLowerCase()
    const url = String(r.url || '').trim()
    if (!ALLOWED.includes(platform as SocialPlatform)) continue
    if (url && !/^https?:\/\//i.test(url)) continue
    cleaned.push({
      platform: platform as SocialPlatform,
      url,
      enabled: r.enabled !== false,
    })
  }

  await updateSchemaSettings({ socialProfiles: JSON.stringify(cleaned) })
  return NextResponse.json({ profiles: cleaned })
}
