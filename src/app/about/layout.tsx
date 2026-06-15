import type { Metadata } from 'next'
import { staticPageMetadata } from '@/lib/seo/static-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata(
    '/about',
    'About Us - Agadir Directory',
    'Learn about Agadir Directory, our mission, vision, and the team behind the most comprehensive guide to Agadir, Morocco.',
  )
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
