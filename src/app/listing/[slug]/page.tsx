/**
 * Listing detail — server-rendered for crawlability and indexation.
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { getListingSeoBundle } from '@/lib/seo/service'
import { SchemaScript } from '@/components/seo/schema-script'
import { ListingDetailPage } from '@/components/listing/listing-detail-page'

interface PageProps {
  params: Promise<{ slug: string }>
}

// ISR: cache the rendered page for 1h instead of re-querying MySQL on every
// hit. Admin edits should call revalidatePath('/listing/<slug>') to publish.
export const revalidate = 3600

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const bundle = await getListingSeoBundle(slug)
  if (!bundle) return { title: 'Not found' }
  return bundle.metadata
}

export default async function ListingPage({ params }: PageProps) {
  const { slug } = await params
  const bundle = await getListingSeoBundle(slug)
  if (!bundle) notFound()

  return (
    <>
      <SchemaScript data={bundle.schemas} />
      <ListingDetailPage bundle={bundle} />
    </>
  )
}
