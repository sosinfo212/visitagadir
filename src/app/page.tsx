import type { Metadata } from 'next'
import { Suspense } from 'react'

import Home from './home-client'
import { HomepageInternalLinks } from '@/components/seo/homepage-internal-links'
import { getHomepageInitialData } from '@/lib/homepage-data'
import { getSeoSettings } from '@/lib/seo/repository'
import { buildMetadata } from '@/lib/seo/metadata'

// ISR: prerender the homepage and refresh hourly. Reading `searchParams` here
// (previously used to noindex ?search / ?listBusiness) forced the whole route
// dynamic (no-store) on every request; the self-referential canonical to "/"
// already prevents query-string variants from being indexed, so the noindex
// is unnecessary and the page can be statically cached.
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings()
  return buildMetadata(seo, { path: '/' })
}

export default async function HomePage() {
  const initialData = await getHomepageInitialData()

  return (
    <>
      <h1 className="sr-only">Visit Agadir — Your Complete Guide to Agadir, Morocco</h1>
      <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">Loading...</div>}>
        <Home initialData={initialData} />
      </Suspense>
      <HomepageInternalLinks />
    </>
  )
}
