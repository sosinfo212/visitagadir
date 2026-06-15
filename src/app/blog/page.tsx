import type { Metadata } from 'next'
import { ensureDefaultBlogCategories } from '@/lib/blog/ensure-categories'
import {
  getBlogCategoriesWithCounts,
  getBlogListSidebarData,
  getPaginatedBlogPosts,
} from '@/lib/blog/blog-list-data'
import { buildBlogListUrl } from '@/lib/blog/pagination'
import { getSeoSettings } from '@/lib/seo/repository'
import { buildMetadata } from '@/lib/seo/metadata'
import { blogPath } from '@/lib/seo/url'
import { BlogCategoryNav } from '@/components/blog/blog-category-nav'
import { BlogListSidebar } from '@/components/blog/blog-list-sidebar'
import { BlogPagination } from '@/components/blog/blog-pagination'
import { BlogPostList } from '@/components/blog/blog-post-list'

export const revalidate = 3600

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}): Promise<Metadata> {
  const { category: categorySlug, page: pageParam } = await searchParams
  const seo = await getSeoSettings()
  const page = Number(pageParam || 1)

  const title = categorySlug
    ? `Blog — ${categorySlug.replace(/-/g, ' ')}`
    : page > 1
      ? `Blog — Page ${page}`
      : 'Blog — Agadir Travel & Local Guides'

  const metadata = buildMetadata(seo, {
    title,
    description:
      'Tips, guides, and stories about Agadir — beaches, restaurants, culture, and things to do in Morocco.',
    path: buildBlogListUrl(blogPath(), page, { category: categorySlug }),
    ogType: 'website',
  })

  return metadata
}

interface BlogPageProps {
  searchParams: Promise<{ category?: string; page?: string }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  await ensureDefaultBlogCategories()
  const { category: categorySlug, page: pageParam } = await searchParams

  const [{ posts, total, page, totalPages }, categories, sidebar] = await Promise.all([
    getPaginatedBlogPosts({ page: pageParam, categorySlug }),
    getBlogCategoriesWithCounts(),
    getBlogListSidebarData(),
  ])

  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-8 lg:gap-10 items-start">
          <div className="min-w-0">
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                {activeCategory ? activeCategory.name : 'Agadir Blog'}
              </h1>
              <p className="text-muted-foreground text-lg">
                {activeCategory?.description ||
                  'Guides, tips, and local insights for visitors and residents.'}
              </p>
              {total > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {total} article{total === 1 ? '' : 's'}
                  {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}
                </p>
              )}
            </div>

            <BlogCategoryNav categories={categories} activeCategorySlug={categorySlug} />

            <BlogPostList posts={posts} />

            <BlogPagination
              basePath={blogPath()}
              page={page}
              totalPages={totalPages}
              query={{ category: categorySlug }}
            />
          </div>

          <aside className="hidden lg:block sticky top-24 self-start">
            <BlogListSidebar
              categories={categories}
              popularPosts={sidebar.popularPosts}
              listings={sidebar.listings}
              activeCategorySlug={categorySlug}
            />
          </aside>
        </div>

        <div className="lg:hidden mt-10">
          <BlogListSidebar
            categories={categories}
            popularPosts={sidebar.popularPosts}
            listings={sidebar.listings}
            activeCategorySlug={categorySlug}
          />
        </div>
      </main>
    </div>
  )
}
