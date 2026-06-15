import type { Metadata } from 'next'
import { staticPageMetadata } from '@/lib/seo/static-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata(
    '/contact',
    'Contact Us - Agadir Directory',
    'Get in touch with Agadir Directory. We are here to help with business listings, advertising inquiries, and general questions.',
  )
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
