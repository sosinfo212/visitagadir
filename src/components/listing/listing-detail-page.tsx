import Link from 'next/link'
import { MapPin, Phone, Globe, Mail, Star, ExternalLink } from 'lucide-react'
import { isHtmlContent } from '@/lib/blog/html'
import { categoryPath, listingPath } from '@/lib/seo/url'
import { BreadcrumbNav } from '@/components/seo/breadcrumb-nav'
import { ListingReviewForm } from '@/components/listing/listing-review-form'
import { ListingPhotosGallery } from '@/components/listing/listing-photos-gallery'
import { listingWebsiteHref } from '@/lib/listing-contact'
import { LISTING_DEFAULT_IMAGE } from '@/lib/listing-images'
import type { getListingSeoBundle } from '@/lib/seo/service'

type ListingBundle = NonNullable<Awaited<ReturnType<typeof getListingSeoBundle>>>

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  )
}

function RelatedList({ title, items }: { title: string; items: ListingBundle['related'] }) {
  if (items.length === 0) return null
  return (
    <div className="bg-white border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={listingPath(item.slug)}
              className="flex items-center gap-3 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image || LISTING_DEFAULT_IMAGE}
                alt={item.name}
                className="h-12 w-12 rounded-lg object-cover shrink-0 bg-gray-100"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-orange-600 transition-colors">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{item.categoryName}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ListingDetailPage({ bundle }: { bundle: ListingBundle }) {
  const { listing, images, breadcrumbs, related, sameCity, nearby } = bundle
  const rating = listing.rating || 0
  const reviewCount = listing.reviewCount || listing.reviews?.length || 0
  const heroImage = images[0]

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="relative w-full max-w-[100vw] h-56 sm:h-72 md:h-80 overflow-hidden bg-gray-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt={listing.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={categoryPath(listing.category.slug)}
            className="inline-flex items-center text-muted-foreground hover:text-orange-600 text-sm mb-3"
          >
            ← Back to {listing.category.name}
          </Link>
          <p className="text-sm text-muted-foreground mb-1">{listing.category.name}</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{listing.name}</h1>
          <div className="flex items-center gap-3">
            <StarDisplay rating={rating} />
            <span className="font-semibold">{rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({reviewCount} reviews)</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <BreadcrumbNav items={breadcrumbs.map((b) => ({ name: b.name, href: b.url }))} />

        <div className="grid lg:grid-cols-3 gap-8 min-w-0">
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {images.length > 0 && (
              <ListingPhotosGallery name={listing.name} images={images} />
            )}

            <section className="bg-white border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-3">About</h2>
              {isHtmlContent(listing.description) ? (
                <div
                  className="blog-content text-muted-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: listing.description }}
                />
              ) : (
                <p className="text-muted-foreground leading-relaxed">{listing.description}</p>
              )}
            </section>

            <section className="bg-white border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">{listing.address}</p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.address + ', Agadir, Morocco')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-orange-600 hover:underline"
                    >
                      View on Google Maps
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
                {listing.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <a href={`tel:${listing.phone}`} className="text-teal-600 hover:underline">
                        {listing.phone}
                      </a>
                    </div>
                  </div>
                )}
                {listing.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Website</p>
                      <a
                        href={listingWebsiteHref(listing.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {listing.website}
                      </a>
                    </div>
                  </div>
                )}
                {listing.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a href={`mailto:${listing.email}`} className="text-purple-600 hover:underline">
                        {listing.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Reviews</h2>
              {listing.reviews.length === 0 ? (
                <p className="text-muted-foreground text-sm">No reviews yet. Be the first to share your experience.</p>
              ) : (
                <ul className="space-y-4">
                  {listing.reviews.map((review) => (
                    <li key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-sm">{review.authorName}</p>
                        <StarDisplay rating={review.rating} />
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-6 pt-6 border-t">
                <ListingReviewForm listingId={listing.id} listingName={listing.name} />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="bg-white border rounded-xl p-5">
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">{rating.toFixed(1)}</div>
                <StarDisplay rating={rating} />
                <p className="text-sm text-muted-foreground mt-2">{reviewCount} reviews</p>
              </div>
              {(listing.phone || listing.website || listing.email) && (
                <div className="mt-4 space-y-2">
                  {listing.phone && (
                    <a
                      href={`tel:${listing.phone}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
                    >
                      <Phone className="h-4 w-4" />
                      Call Now
                    </a>
                  )}
                  {listing.website && (
                    <a
                      href={listingWebsiteHref(listing.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      <Globe className="h-4 w-4" />
                      Visit Website
                    </a>
                  )}
                  {listing.email && (
                    <a
                      href={`mailto:${listing.email}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      <Mail className="h-4 w-4" />
                      Send Email
                    </a>
                  )}
                </div>
              )}
            </div>

            <RelatedList title="More in this category" items={related} />
            <RelatedList title={`Also in ${listing.city}`} items={sameCity} />
            <RelatedList title="Nearby" items={nearby} />

            <div className="bg-white border rounded-xl p-4 text-sm">
              <Link href="/" className="text-orange-600 hover:underline font-medium">
                ← Back to homepage
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
