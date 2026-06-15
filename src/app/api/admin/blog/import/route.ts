import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { importWordPressExport } from '@/lib/blog/wordpress-import'

export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_XML_BYTES = 25 * 1024 * 1024

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
      return NextResponse.json({ error: 'XML file is too large (max 25 MB).' }, { status: 400 })
    }

    const xml = await file.text()
    if (!xml.includes('<rss') || !xml.includes('<wp:post_type>')) {
      return NextResponse.json({ error: 'This does not look like a valid WordPress WXR export.' }, { status: 400 })
    }

    const result = await importWordPressExport(xml, { skipExisting, includeDrafts })

    return NextResponse.json({
      success: true,
      message: 'WordPress import completed.',
      ...result,
    })
  } catch (error) {
    console.error('WordPress blog import error:', error)
    return NextResponse.json({ error: 'Failed to import WordPress export.' }, { status: 500 })
  }
}
