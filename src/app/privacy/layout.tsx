import type { Metadata } from 'next'
import { staticPageMetadata } from '@/lib/seo/static-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata(
    '/privacy',
    'Privacy Policy - Agadir Directory',
    'Read our privacy policy to understand how Agadir Directory collects, uses, and protects your personal information.',
  )
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
