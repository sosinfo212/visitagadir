import { NextResponse } from 'next/server'
import { getAppSettings, toPublicSettings } from '@/lib/app-settings'

export async function GET() {
  try {
    const settings = await getAppSettings()
    return NextResponse.json(toPublicSettings(settings))
  } catch (error) {
    console.error('Public settings error:', error)
    return NextResponse.json({
      siteName: 'Agadir Directory',
      siteLogoUrl: '/agadir-logo.png',
      siteLogoWidth: 32,
      siteLogoHeight: 32,
      faviconUrl: '/agadir-logo.png',
      footerLogoUrl: '/agadir-logo.png',
      footerLogoWidth: 32,
      footerLogoHeight: 32,
    })
  }
}
