'use client'

import { usePathname } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import type { AppSettingsPublic } from '@/lib/app-settings'

export function PublicChrome({
  children,
  branding,
}: {
  children: React.ReactNode
  branding: AppSettingsPublic | null
}) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader branding={branding} />
      <div className="flex-1 flex flex-col">{children}</div>
      <SiteFooter branding={branding} />
    </div>
  )
}
