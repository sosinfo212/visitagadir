import type { Metadata } from 'next'
import { noindexPageMetadata } from '@/lib/seo/static-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return noindexPageMetadata('My Listings - Agadir Directory')
}

export default function MyListingsLayout({ children }: { children: React.ReactNode }) {
  return children
}
