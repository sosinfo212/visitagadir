import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { getSchemaSettings, saveSchemaSettings, SeoValidationError } from '@/lib/seo/service'
import { revalidateSiteWide } from '@/lib/revalidate'
import { SCHEMA_TYPE_CATALOG } from '@/lib/seo/types'

/**
 * Manages Organization + WebSite schema source-of-truth.
 * Social profiles are managed via the sibling /social route to keep this
 * endpoint focused.
 */

const FIELDS = [
  'organizationName',
  'organizationType',
  'logoUrl',
  'phone',
  'email',
  'streetAddress',
  'addressLocality',
  'addressRegion',
  'postalCode',
  'country',
  'websiteUrl',
  'searchUrlPattern',
] as const

export async function GET() {
  const authed = await isAuthenticated()
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const settings = await getSchemaSettings()
  return NextResponse.json({
    ...settings,
    schemaTypeCatalog: SCHEMA_TYPE_CATALOG,
  })
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
  for (const f of FIELDS) {
    if (f in body) {
      const v = body[f]
      if (v === null || v === '') patch[f] = isOptional(f) ? null : ''
      else if (typeof v === 'string') patch[f] = v.trim()
    }
  }

  for (const f of ['organizationName', 'organizationType', 'addressLocality',
    'addressRegion', 'country', 'websiteUrl', 'searchUrlPattern'] as const) {
    if (patch[f] === '') return NextResponse.json({ error: `${f} cannot be empty` }, { status: 400 })
  }

  try {
    const updated = await saveSchemaSettings(patch)
    revalidateSiteWide()
    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof SeoValidationError) {
      return NextResponse.json({ error: e.errors.join('; ') }, { status: 400 })
    }
    throw e
  }
}

function isOptional(f: string): boolean {
  return ['logoUrl', 'phone', 'email', 'streetAddress', 'postalCode'].includes(f)
}
