import type { Metadata } from 'next'

import Home from './home-client'
import { HomepageInternalLinks } from '@/components/seo/homepage-internal-links'
import { getHomepageInitialData } from '@/lib/homepage-data'
import { getSeoSettings } from '@/lib/seo/repository'
import { buildMetadata } from '@/lib/seo/metadata'

interface PageProps {
  searchParams: Promise<{ search?: string; listBusiness?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const seo = await getSeoSettings()
  const noindex = Boolean(params.search?.trim()) || params.listBusiness === '1'
  return buildMetadata(seo, { path: '/', noindex })
}

export default async function HomePage() {
  const initialData = await getHomepageInitialData()

  return (
    <>
      <h1 className="sr-only">Agadir Directory — Your Complete Guide to Agadir, Morocco</h1>
      <Home initialData={initialData} />
      <HomepageInternalLinks />
    </>
  )
}
