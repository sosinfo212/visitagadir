import { NextRequest, NextResponse } from 'next/server'
import { isExtensionAuthorized } from '@/lib/extension-auth'
import {
  importListingFromExtension,
  type ExtensionImportInput,
} from '@/lib/listings/extension-listing-import'

export async function POST(request: NextRequest) {
  if (!isExtensionAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Set EXTENSION_API_KEY on the server and X-Extension-Key in the extension.' },
      { status: 401 },
    )
  }

  try {
    const body = (await request.json()) as ExtensionImportInput
    const { name, description, address, categoryId } = body

    if (!name?.trim() || !description?.trim() || !address?.trim() || !categoryId?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, address, categoryId' },
        { status: 400 },
      )
    }

    const result = await importListingFromExtension(body)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin

    return NextResponse.json(
      {
        ...result,
        url: `${siteUrl.replace(/\/$/, '')}/listing/${result.slug}`,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Extension import error:', error)
    const message = error instanceof Error ? error.message : 'Import failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
