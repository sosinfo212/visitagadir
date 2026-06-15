import { NextResponse } from 'next/server'
import { buildListingsXml } from '@/lib/listings/listings-xml'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const xml = await buildListingsXml()
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (error) {
    console.error('Listings XML feed error:', error)
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate listings feed</error>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    })
  }
}
