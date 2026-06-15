import type { Metadata } from 'next'
import { noindexPageMetadata } from '@/lib/seo/static-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return noindexPageMetadata('Sign Up - Agadir Directory')
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
