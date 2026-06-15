import { db } from '@/lib/db'
import { getFeaturedListings, type ListingLink } from '@/lib/seo/internal-linking'
import { BLOG_POSTS_PER_PAGE, blogTotalPages, parseBlogPage } from '@/lib/blog/pagination'

export type BlogPostCardData = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  authorName: string
  publishedAt: Date | null
  category: { name: string; slug: string } | null
}

export type BlogCategoryNavItem = {
  id: string
  name: string
  slug: string
  description: string | null
  postCount: number
}

const postCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  authorName: true,
  publishedAt: true,
  category: { select: { name: true, slug: true } },
} as const

export async function getBlogCategoriesWithCounts(): Promise<BlogCategoryNavItem[]> {
  const rows = await db.blogCategory.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: {
          posts: { where: { status: 'published' } },
        },
      },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    postCount: row._count.posts,
  }))
}

export async function getPaginatedBlogPosts(args: {
  page?: number | string | string[] | undefined
  categorySlug?: string
  categoryId?: string
}): Promise<{
  posts: BlogPostCardData[]
  total: number
  page: number
  totalPages: number
}> {
  const page = parseBlogPage(args.page)
  const skip = (page - 1) * BLOG_POSTS_PER_PAGE

  const where = {
    status: 'published' as const,
    ...(args.categoryId
      ? { categoryId: args.categoryId }
      : args.categorySlug
        ? { category: { slug: args.categorySlug } }
        : {}),
  }

  const [posts, total] = await Promise.all([
    db.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: BLOG_POSTS_PER_PAGE,
      select: postCardSelect,
    }),
    db.blogPost.count({ where }),
  ])

  const totalPages = blogTotalPages(total)
  const safePage = Math.min(page, totalPages)

  if (safePage !== page && total > 0) {
    const adjustedSkip = (safePage - 1) * BLOG_POSTS_PER_PAGE
    const adjustedPosts = await db.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: adjustedSkip,
      take: BLOG_POSTS_PER_PAGE,
      select: postCardSelect,
    })
    return { posts: adjustedPosts, total, page: safePage, totalPages }
  }

  return { posts, total, page, totalPages }
}

export async function getPopularBlogPosts(limit = 5): Promise<BlogPostCardData[]> {
  return db.blogPost.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: postCardSelect,
  })
}

export async function getBlogListSidebarData(): Promise<{
  popularPosts: BlogPostCardData[]
  listings: ListingLink[]
}> {
  const [popularPosts, listings] = await Promise.all([
    getPopularBlogPosts(5),
    getFeaturedListings(4),
  ])
  return { popularPosts, listings }
}
