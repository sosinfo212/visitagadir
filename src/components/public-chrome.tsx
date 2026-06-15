'use client'

import { usePathname } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  return (
    <>
      {!isAdmin && <SiteHeader />}
      {children}
    </>
  )
}
