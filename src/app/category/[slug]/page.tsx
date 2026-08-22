/**
 * Server-rendered category page.
 *
 * Emits CollectionPage + BreadcrumbList JSON-LD, full meta tags,
 * canonical URL, server-rendered grid of listing links, and a
 * "Related categories" link block. Fully crawlable & directly visitable.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

import { db } from '@/lib/db'
import { getListingDisplayImages } from '@/lib/listing-images'
import { getSeoSettings, getSchemaSettings } from '@/lib/seo/repository'
import { buildMetadata } from '@/lib/seo/metadata'
import {
  buildCollectionPageSchema,
  buildBreadcrumbSchema,
  buildOrganizationSchema,
} from '@/lib/seo/schema'
import { categoryPath, listingPath } from '@/lib/seo/url'
import { getRelatedCategories, getListingsInCategory } from '@/lib/seo/internal-linking'
import { SchemaScript } from '@/components/seo/schema-script'
import { BreadcrumbNav } from '@/components/seo/breadcrumb-nav'
import { OptimizedImage } from '@/components/optimized-image'

interface PageProps {
  params: Promise<{ slug: string }>
}

// ISR: serve cached HTML for 1h; revalidatePath on category/listing edits.
export const revalidate = 3600

// On-demand ISR: cache each category page after first render, revalidate hourly.
export async function generateStaticParams() {
  return []
}

async function loadCategory(slug: string) {
  return db.category.findUnique({ where: { slug } })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const cat = await loadCategory(slug)
  if (!cat) return { title: 'Not found' }
  const seo = await getSeoSettings()
  return buildMetadata(seo, {
    title: cat.seoTitle || `${cat.name} in Agadir`,
    description: cat.metaDescription || cat.description || `Browse the best ${cat.name.toLowerCase()} in Agadir, Morocco.`,
    keywords: cat.metaKeywords,
    image: cat.image,
    path: categoryPath(cat.slug),
    canonicalOverride: cat.canonicalUrl,
    ogType: 'website',
  })
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const cat = await loadCategory(slug)
  if (!cat) notFound()

  const [seo, schemaCfg, listings, related] = await Promise.all([
    getSeoSettings(),
    getSchemaSettings(),
    getListingsInCategory(slug, 60),
    getRelatedCategories(slug, 8),
  ])

  // Load listing rows for the rendered grid. Explicit select keeps the
  // heavy TEXT/MEDIUMTEXT columns (description, logo, SEO overrides) out —
  // the grid only needs identity, address, rating, and the cover image.
  const fullListings = await db.listing.findMany({
    where: { categoryId: cat.id, published: true },
    take: 60,
    orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      rating: true,
      reviewCount: true,
      featured: true,
      image: true,
      gallery: true,
    },
  })
  const listingsWithImage = fullListings.map(l => ({
    ...l,
    images: getListingDisplayImages(l.image, l.gallery),
  }))

  const breadcrumbs = [
    { name: 'Home', url: seo.siteUrl },
    { name: cat.name },
  ]

  const schemas = [
    buildOrganizationSchema(seo, schemaCfg),
    buildBreadcrumbSchema(breadcrumbs),
    buildCollectionPageSchema({ category: cat, listings, siteUrl: seo.siteUrl }),
  ]

  return (
    <>
      <SchemaScript data={schemas} />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <BreadcrumbNav items={breadcrumbs.map(b => ({ name: b.name, href: b.url }))} />

          <header className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{cat.name}</h1>
            {cat.description && (
              <p className="text-muted-foreground max-w-3xl leading-relaxed">{cat.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {listingsWithImage.length} listing{listingsWithImage.length === 1 ? '' : 's'}
            </p>
          </header>

          <div className="grid lg:grid-cols-4 gap-6">
            <section className="lg:col-span-3">
              {listingsWithImage.length === 0 ? (
                <div className="bg-white border rounded-xl p-10 text-center text-muted-foreground">
                  No businesses listed in this category yet.
                </div>
              ) : (
                <ul className="grid sm:grid-cols-2 gap-4">
                  {listingsWithImage.map(l => (
                    <li key={l.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <Link href={listingPath(l.slug)} className="block">
                        <div className="relative h-36 bg-gray-100">
                          <OptimizedImage
                            src={l.images[0]}
                            alt={l.name}
                            fill
                            sizes="(max-width: 640px) 100vw, 50vw"
                            className="object-cover"
                          />
                          {l.featured && (
                            <span className="absolute top-2 left-2 text-[10px] bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                              FEATURED
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <h2 className="font-semibold text-gray-900 leading-tight">{l.name}</h2>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{l.address}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            ★ {(l.rating || 3).toFixed(1)} · {l.reviewCount || 0} reviews
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <aside className="space-y-6">
              {related.length > 0 && (
                <div className="bg-white border rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Related categories</h3>
                  <ul className="space-y-2 text-sm">
                    {related.map(c => (
                      <li key={c.slug}>
                        <Link href={categoryPath(c.slug)} className="hover:text-orange-600">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="bg-white border rounded-xl p-4 text-sm">
                <Link href="/" className="text-orange-600 hover:underline font-medium">
                  ← Back to homepage
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}
