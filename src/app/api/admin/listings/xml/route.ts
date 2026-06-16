import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAuthenticated } from '@/lib/admin-auth'
import { getListingsXmlStatus, writeListingsXmlFile } from '@/lib/listings/listings-xml'

export async function GET() {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await getListingsXmlStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error('Listings XML status error:', error)
    return NextResponse.json({ error: 'Failed to load listings XML status.' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await writeListingsXmlFile()
    revalidatePath('/listings.xml')

    const status = await getListingsXmlStatus()
    return NextResponse.json({
      success: true,
      message: 'Listings XML regenerated.',
      listingCount: result.listingCount,
      generatedAt: result.generatedAt,
      fileSize: result.fileSize,
      ...status,
    })
  } catch (error) {
    console.error('Listings XML regenerate error:', error)
    return NextResponse.json({ error: 'Failed to regenerate listings XML.' }, { status: 500 })
  }
}
