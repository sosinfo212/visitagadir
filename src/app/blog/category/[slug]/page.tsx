import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import {
  getBlogCategoriesWithCounts,
  getBlogListSidebarData,
  getPaginatedBlogPosts,
} from '@/lib/blog/blog-list-data'
import { buildBlogListUrl } from '@/lib/blog/pagination'
import { getSeoSettings } from '@/lib/seo/repository'
import { buildMetadata } from '@/lib/seo/metadata'
import { blogCategoryPath } from '@/lib/seo/url'
import { BlogCategoryNav } from '@/components/blog/blog-category-nav'
import { BlogListSidebar } from '@/components/blog/blog-list-sidebar'
import { BlogPagination } from '@/components/blog/blog-pagination'
import { BlogPostList } from '@/components/blog/blog-post-list'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const category = await db.blogCategory.findUnique({ where: { slug } })
  if (!category) return { title: 'Not found' }

  const page = Number(pageParam || 1)
  const seo = await getSeoSettings()
  const title =
    page > 1 ? `${category.name} — Page ${page}` : `${category.name} — Agadir Blog`

  return buildMetadata(seo, {
    title,
    description: category.description || `Articles about ${category.name.toLowerCase()} in Agadir.`,
    path: buildBlogListUrl(blogCategoryPath(category.slug), page),
    ogType: 'website',
    // Blog-category archives are thin nav pages — 19 of them, all with ~0
    // impressions/0 clicks, and they cannibalize each other. noindex,follow
    // removes the index bloat while keeping them crawlable for discovery.
    robots: 'noindex, follow',
  })
}

export default async function BlogCategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams

  const category = await db.blogCategory.findUnique({ where: { slug } })
  if (!category) notFound()

  const [{ posts, total, page, totalPages }, categories, sidebar] = await Promise.all([
    getPaginatedBlogPosts({ page: pageParam, categoryId: category.id }),
    getBlogCategoriesWithCounts(),
    getBlogListSidebarData(),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-8 lg:gap-10 items-start">
          <div className="min-w-0">
            <div className="mb-8">
              <p className="text-sm text-orange-600 font-medium mb-2">Blog category</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-muted-foreground text-lg">{category.description}</p>
              )}
              {total > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {total} article{total === 1 ? '' : 's'}
                  {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}
                </p>
              )}
            </div>

            <BlogCategoryNav categories={categories} activeCategorySlug={category.slug} />

            <BlogPostList posts={posts} emptyMessage="No posts in this category yet." />

            <BlogPagination
              basePath={blogCategoryPath(category.slug)}
              page={page}
              totalPages={totalPages}
            />
          </div>

          <aside className="hidden lg:block sticky top-24 self-start">
            <BlogListSidebar
              categories={categories}
              popularPosts={sidebar.popularPosts}
              listings={sidebar.listings}
              activeCategorySlug={category.slug}
            />
          </aside>
        </div>

        <div className="lg:hidden mt-10">
          <BlogListSidebar
            categories={categories}
            popularPosts={sidebar.popularPosts}
            listings={sidebar.listings}
            activeCategorySlug={category.slug}
          />
        </div>
      </main>
    </div>
  )
}
