import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { getAppSettings, toAdminSettings, updateAppSettings } from '@/lib/app-settings'
import { revalidateSiteWide } from '@/lib/revalidate'

export async function GET() {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getAppSettings()
    return NextResponse.json(toAdminSettings(settings))
  } catch (error) {
    console.error('Get app settings error:', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updated = await updateAppSettings({
      siteName: body.siteName,
      siteLogoUrl: body.siteLogoUrl,
      siteLogoWidth: body.siteLogoWidth,
      siteLogoHeight: body.siteLogoHeight,
      faviconUrl: body.faviconUrl,
      footerLogoUrl: body.footerLogoUrl,
      footerLogoWidth: body.footerLogoWidth,
      footerLogoHeight: body.footerLogoHeight,
      adminName: body.adminName,
      adminEmail: body.adminEmail,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    })

    revalidateSiteWide()
    return NextResponse.json(toAdminSettings(updated))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save settings'
    const status = message.includes('password') || message.includes('required') || message.includes('valid') || message.includes('between')
      ? 400
      : 500
    console.error('Update app settings error:', error)
    return NextResponse.json({ error: message }, { status })
  }
}
