import type { Metadata } from 'next'
import { staticPageMetadata } from '@/lib/seo/static-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata(
    '/advertise',
    'Advertise - Agadir Directory',
    'Advertise your business on Agadir Directory and reach thousands of potential customers. Explore our advertising plans and pricing.',
  )
}

export default function AdvertiseLayout({ children }: { children: React.ReactNode }) {
  return children
}
