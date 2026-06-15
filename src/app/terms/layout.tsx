import type { Metadata } from 'next'
import { staticPageMetadata } from '@/lib/seo/static-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata(
    '/terms',
    'Terms of Service - Agadir Directory',
    'Read the terms of service for Agadir Directory. Understand the rules and guidelines for using our city directory platform.',
  )
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
