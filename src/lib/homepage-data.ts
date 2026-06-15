/**
 * Server-side homepage bootstrap data — avoids client loading shell on first paint.
 */

import { db } from '@/lib/db'
import { buildImagesArray } from '@/lib/listing-images'
import { getAppSettings, toPublicSettings } from '@/lib/app-settings'

export interface HomepageInitialData {
  categories: Array<{
    id: string
    name: string
    slug: string
    icon: string
    description: string
    listingCount: number
  }>
  featuredListings: Array<{
    id: string
    name: string
    slug: string
    description: string
    address: string
    phone: string | null
    website: string | null
    email: string | null
    image: string | null
    images: string[]
    rating: number
    reviewCount: number
    featured: boolean
    categoryId: string
    category: { name: string; slug: string; icon: string }
  }>
  latestBlogPosts: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    coverImage: string | null
    authorName: string
    publishedAt: string | null
    category: { name: string; slug: string }
  }>
  siteBranding: {
    siteName: string
    siteLogoUrl: string
    siteLogoWidth: number
    siteLogoHeight: number
    footerLogoUrl: string
    footerLogoWidth: number
    footerLogoHeight: number
  }
}

export async function getHomepageInitialData(): Promise<HomepageInitialData> {
  const [categoriesRaw, featuredRaw, blogPosts, settings] = await Promise.all([
    db.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { listings: true } } },
    }),
    db.listing.findMany({
      where: { featured: true, published: true },
      take: 12,
      orderBy: [{ rating: 'desc' }],
      include: { category: { select: { name: true, slug: true, icon: true } } },
    }),
    db.blogPost.findMany({
      where: { status: 'published' },
      take: 3,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        authorName: true,
        publishedAt: true,
        category: { select: { name: true, slug: true } },
      },
    }),
    getAppSettings(),
  ])

  const branding = toPublicSettings(settings)

  return {
    categories: categoriesRaw.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      description: c.description,
      listingCount: c._count.listings,
    })),
    featuredListings: featuredRaw.map((l) => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      description: l.description,
      address: l.address,
      phone: l.phone,
      website: l.website,
      email: l.email,
      image: l.image,
      images: buildImagesArray(l.image, l.gallery),
      rating: l.rating,
      reviewCount: l.reviewCount,
      featured: l.featured,
      categoryId: l.categoryId,
      category: l.category,
    })),
    latestBlogPosts: blogPosts.map((p) => ({
      ...p,
      publishedAt: p.publishedAt?.toISOString() ?? null,
    })),
    siteBranding: {
      siteName: branding.siteName,
      siteLogoUrl: branding.siteLogoUrl || '/agadir-logo.png',
      siteLogoWidth: branding.siteLogoWidth || 32,
      siteLogoHeight: branding.siteLogoHeight || 32,
      footerLogoUrl: branding.footerLogoUrl || branding.siteLogoUrl || '/agadir-logo.png',
      footerLogoWidth: branding.footerLogoWidth || 32,
      footerLogoHeight: branding.footerLogoHeight || 32,
    },
  }
}
