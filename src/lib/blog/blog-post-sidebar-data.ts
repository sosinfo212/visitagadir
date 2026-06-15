import { db } from '@/lib/db'
import { getFeaturedListings, getListingsInCategory, type ListingLink } from '@/lib/seo/internal-linking'

/** Map editorial blog categories to directory listing categories. */
const BLOG_TO_DIRECTORY_CATEGORY: Record<string, string> = {
  'travel-guides': 'tours-excursions',
  'beaches-nature': 'beaches-water-sports',
  'food-dining': 'restaurants-cafes',
  'culture-events': 'nightlife-entertainment',
  'tips-practical': 'professional-services',
}

export interface RelatedBlogPost {
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  publishedAt: Date | null
  category: { name: string; slug: string } | null
}

export async function getRelatedBlogPosts(args: {
  postId: string
  categoryId: string
  limit?: number
}): Promise<RelatedBlogPost[]> {
  const limit = args.limit ?? 4

  const sameCategory = await db.blogPost.findMany({
    where: {
      status: 'published',
      categoryId: args.categoryId,
      id: { not: args.postId },
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      category: { select: { name: true, slug: true } },
    },
  })

  if (sameCategory.length >= limit) return sameCategory.map(stripId)

  const fallback = await db.blogPost.findMany({
    where: {
      status: 'published',
      id: { notIn: [args.postId, ...sameCategory.map((p) => p.id)] },
    },
    orderBy: { publishedAt: 'desc' },
    take: limit - sameCategory.length,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      category: { select: { name: true, slug: true } },
    },
  })

  return sameCategory.map(stripId).concat(fallback.map(stripId))
}

function stripId(post: {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  publishedAt: Date | null
  category: { name: string; slug: string } | null
}): RelatedBlogPost {
  const { id: _id, ...rest } = post
  return rest
}

export async function getBlogSidebarListings(blogCategorySlug: string | undefined, limit = 4): Promise<ListingLink[]> {
  const directorySlug = blogCategorySlug ? BLOG_TO_DIRECTORY_CATEGORY[blogCategorySlug] : undefined

  if (directorySlug) {
    const inCategory = await getListingsInCategory(directorySlug, limit)
    if (inCategory.length > 0) return inCategory
  }

  return getFeaturedListings(limit)
}
