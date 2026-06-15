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
  return db.blogPost.findMany({
    where: {
      status: 'published',
      categoryId: args.categoryId,
      id: { not: args.postId },
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      category: { select: { name: true, slug: true } },
    },
  })
}

export async function getBlogSidebarListings(blogCategorySlug: string | undefined, limit = 4): Promise<ListingLink[]> {
  const directorySlug = blogCategorySlug ? BLOG_TO_DIRECTORY_CATEGORY[blogCategorySlug] : undefined

  if (directorySlug) {
    const inCategory = await getListingsInCategory(directorySlug, limit)
    if (inCategory.length > 0) return inCategory
  }

  return getFeaturedListings(limit)
}
