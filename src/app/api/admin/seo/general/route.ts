import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { getSeoSettings, saveSeoSettings, SeoValidationError } from '@/lib/seo/service'

const TEXT_FIELDS = [
  'siteName',
  'siteUrl',
  'defaultTitle',
  'titleTemplate',
  'defaultDescription',
  'defaultKeywords',
  'defaultRobots',
  'canonicalDomain',
  'faviconUrl',
  'defaultOgImage',
  'defaultLocale',
  'twitterHandle',
  'twitterCardType',
] as const

type AllowedField = (typeof TEXT_FIELDS)[number]

export async function GET() {
  const authed = await isAuthenticated()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const settings = await getSeoSettings()
  return NextResponse.json(settings)
}

export async function PUT(request: NextRequest) {
  const authed = await isAuthenticated()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const patch: Record<string, string | null> = {}
  for (const field of TEXT_FIELDS) {
    if (field in body) {
      const v = body[field]
      if (v === null || v === '') {
        // Allow nullables to be cleared, but never null on non-nullable fields.
        patch[field as AllowedField] = isOptional(field) ? null : (v === '' ? '' : '')
      } else if (typeof v === 'string') {
        patch[field as AllowedField] = v.trim()
      }
    }
  }

  // Guard: never let required strings become empty.
  for (const f of ['siteName', 'siteUrl', 'defaultTitle', 'titleTemplate',
    'defaultDescription', 'defaultRobots', 'canonicalDomain',
    'faviconUrl', 'defaultLocale', 'twitterCardType'] as const) {
    if (patch[f] === '') return NextResponse.json({ error: `${f} cannot be empty` }, { status: 400 })
  }

  try {
    const updated = await saveSeoSettings(patch)
    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof SeoValidationError) {
      return NextResponse.json({ error: e.errors.join('; ') }, { status: 400 })
    }
    throw e
  }
}

function isOptional(f: string): boolean {
  return ['defaultKeywords', 'defaultOgImage', 'twitterHandle'].includes(f)
}
