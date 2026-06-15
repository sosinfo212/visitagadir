import type { Metadata } from 'next'
import { noindexPageMetadata } from '@/lib/seo/static-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return noindexPageMetadata('Sign In - Agadir Directory')
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
