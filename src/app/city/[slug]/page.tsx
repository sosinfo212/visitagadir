/**
 * Server-rendered city hub page.
 * Lists all businesses in a given city with CollectionPage + BreadcrumbList JSON-LD.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

import { db } from '@/lib/db'
import { getCitySeoBundle } from '@/lib/seo/service'
import { categoryPath, listingPath } from '@/lib/seo/url'
import { SchemaScript } from '@/components/seo/schema-script'
import { BreadcrumbNav } from '@/components/seo/breadcrumb-nav'

interface PageProps {
  params: Promise<{ slug: string }>
}

// ISR: cache city hub HTML for 1h instead of rebuilding from DB per request.
export const revalidate = 3600

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const bundle = await getCitySeoBundle(slug)
  if (!bundle) return { title: 'Not found' }
  return bundle.metadata
}

export default async function CityPage({ params }: PageProps) {
  const { slug } = await params
  const bundle = await getCitySeoBundle(slug)
  if (!bundle) notFound()

  const { city, count, listings, categories, breadcrumbs, schemas } = bundle

  // Crawlable index of EVERY published listing in the city (slug+name only).
  // The card grid above caps at 60; this full link list gives every listing an
  // internal crawl path so deep listings get discovered. Keeps the page ISR.
  const allLinks = await db.listing.findMany({
    where: { city, published: true },
    select: { slug: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <>
      <SchemaScript data={schemas} />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <BreadcrumbNav items={breadcrumbs.map(b => ({ name: b.name, href: b.url }))} />

          <header className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Businesses in {city}</h1>
            <p className="text-muted-foreground">
              {count} listing{count === 1 ? '' : 's'} in {city}, Morocco
            </p>
          </header>

          <div className="grid lg:grid-cols-4 gap-6">
            <section className="lg:col-span-3">
              {listings.length === 0 ? (
                <div className="bg-white border rounded-xl p-10 text-center text-muted-foreground">
                  No businesses in this city yet.
                </div>
              ) : (
                <ul className="grid sm:grid-cols-2 gap-4">
                  {listings.map(l => (
                    <li key={l.slug} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
                      <Link href={listingPath(l.slug)} className="block space-y-1">
                        <h2 className="font-semibold text-gray-900">{l.name}</h2>
                        <p className="text-xs text-muted-foreground">{l.categoryName}</p>
                        <p className="text-xs text-muted-foreground">★ {(l.rating || 3).toFixed(1)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <aside className="space-y-6">
              <div className="bg-white border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Browse by category</h3>
                <ul className="space-y-2 text-sm">
                  {categories.map(c => (
                    <li key={c.slug}>
                      <Link href={categoryPath(c.slug)} className="hover:text-orange-600">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white border rounded-xl p-4 text-sm">
                <Link href="/" className="text-orange-600 hover:underline font-medium">
                  ← Back to homepage
                </Link>
              </div>
            </aside>
          </div>

          {allLinks.length > 12 && (
            <section aria-labelledby="all-listings-heading" className="bg-white border rounded-xl p-5">
              <h2 id="all-listings-heading" className="text-lg font-semibold text-gray-900 mb-3">
                All businesses in {city} ({allLinks.length})
              </h2>
              <ul className="columns-2 sm:columns-3 lg:columns-4 gap-6 text-sm [&>li]:mb-1.5 [&>li]:break-inside-avoid">
                {allLinks.map(l => (
                  <li key={l.slug}>
                    <Link href={listingPath(l.slug)} className="text-gray-600 hover:text-orange-600 hover:underline">
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
