import { NextResponse } from 'next/server'
import { getAdsTxtContent } from '@/lib/ads-txt'

export async function GET() {
  try {
    const content = await getAdsTxtContent()
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (error) {
    console.error('Error serving ads.txt:', error)
    return new NextResponse('', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
