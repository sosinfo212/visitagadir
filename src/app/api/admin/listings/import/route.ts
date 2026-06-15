import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { importWordPressListings } from '@/lib/listings/wordpress-listing-import'

export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_XML_BYTES = 30 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file')
    const skipExisting = formData.get('skipExisting') !== 'false'
    const includeDrafts = formData.get('includeDrafts') === 'true'

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'WordPress XML file is required.' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.xml')) {
      return NextResponse.json({ error: 'Please upload a WordPress .xml export file.' }, { status: 400 })
    }

    if (file.size > MAX_XML_BYTES) {
      return NextResponse.json({ error: 'XML file is too large (max 30 MB).' }, { status: 400 })
    }

    const xml = await file.text()
    if (!xml.includes('<rss') || !xml.includes('job_listing')) {
      return NextResponse.json(
        { error: 'This does not look like a valid WordPress listings export (job_listing).' },
        { status: 400 },
      )
    }

    const result = await importWordPressListings(xml, { skipExisting, includeDrafts })

    return NextResponse.json({
      success: true,
      message: 'WordPress listings import completed.',
      ...result,
    })
  } catch (error) {
    console.error('WordPress listings import error:', error)
    return NextResponse.json({ error: 'Failed to import WordPress listings export.' }, { status: 500 })
  }
}
