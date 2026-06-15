import Link from 'next/link'
import { Building2, Calendar, ChevronRight, MapPin, Plus, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DynamicAdSlot } from '@/components/dynamic-ad-slot'
import { LISTING_DEFAULT_IMAGE } from '@/lib/listing-images'
import type { BlogCategoryNavItem, BlogPostCardData } from '@/lib/blog/blog-list-data'
import type { ListingLink } from '@/lib/seo/internal-linking'
import { blogPostPath, categoryPath, listingPath } from '@/lib/seo/url'
import { BlogCategoryNav } from '@/components/blog/blog-category-nav'

function formatDate(d: Date | null) {
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface BlogListSidebarProps {
  categories: BlogCategoryNavItem[]
  popularPosts: BlogPostCardData[]
  listings: ListingLink[]
  activeCategorySlug?: string | null
}

export function BlogListSidebar({
  categories,
  popularPosts,
  listings,
  activeCategorySlug,
}: BlogListSidebarProps) {
  return (
    <div className="space-y-6">
      <DynamicAdSlot
        location="blog_list_sidebar"
        lazy
        className="min-h-[250px] rounded-xl overflow-hidden"
      />

      {popularPosts.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Popular articles</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {popularPosts.map((post) => (
              <Link
                key={post.id}
                href={blogPostPath(post.slug)}
                className="group flex gap-3 rounded-xl hover:bg-muted/40 p-2 -mx-2 transition-colors"
              >
                <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.coverImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-100 to-teal-100" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 group-hover:text-orange-700 transition-colors">
                    {post.title}
                  </p>
                  {post.publishedAt && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.publishedAt)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {categories.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Categories</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <BlogCategoryNav
              categories={categories}
              activeCategorySlug={activeCategorySlug}
              variant="sidebar"
            />
          </CardContent>
        </Card>
      )}

      {listings.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-teal-600" />
              Featured in Agadir
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {listings.map((listing) => (
              <Link
                key={listing.slug}
                href={listingPath(listing.slug)}
                className="group flex gap-3 rounded-xl border border-transparent hover:border-orange-100 hover:bg-orange-50/40 p-2 -mx-2 transition-all"
              >
                <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={listing.image ?? LISTING_DEFAULT_IMAGE}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 group-hover:text-orange-700">
                    {listing.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{listing.categoryName}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{listing.rating.toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            ))}
            <Link
              href={listings[0] ? categoryPath(listings[0].categorySlug) : '/'}
              className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 pt-1"
            >
              Browse directory
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm overflow-hidden border-orange-100 bg-gradient-to-br from-orange-50 to-teal-50">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-teal-500 text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Own a business in Agadir?</p>
              <p className="text-xs text-muted-foreground">Get discovered by thousands of visitors.</p>
            </div>
          </div>
          <Button
            asChild
            className="w-full h-10 bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white rounded-xl gap-1.5"
          >
            <Link href="/?listBusiness=1">
              <Plus className="h-4 w-4" />
              List your business — free
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
