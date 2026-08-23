import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Calendar, Clock, User } from 'lucide-react'
import { db } from '@/lib/db'
import { getSeoSettings } from '@/lib/seo/repository'
import { buildMetadata } from '@/lib/seo/metadata'
import { buildBlogPostingSchema, buildBreadcrumbSchema } from '@/lib/seo/schema'
import { blogCategoryPath, blogPath, blogPostPath } from '@/lib/seo/url'
import { SchemaScript } from '@/components/seo/schema-script'
import { BreadcrumbNav } from '@/components/seo/breadcrumb-nav'
import { Badge } from '@/components/ui/badge'
import { stripHtml } from '@/lib/blog/html'
import { prepareBlogContent, estimateReadTimeMinutes } from '@/lib/blog/toc'
import { getRelatedBlogPosts, getBlogSidebarListings } from '@/lib/blog/blog-post-sidebar-data'
import { BlogPostLeftSidebar } from '@/components/blog/blog-post-left-sidebar'
import { BlogPostRightSidebar } from '@/components/blog/blog-post-right-sidebar'
import { BlogPostContent } from '@/components/blog/blog-post-content'
import { OptimizedImage } from '@/components/optimized-image'

interface PageProps {
  params: Promise<{ slug: string }>
}

// ISR: cache published post HTML for 1h; revalidatePath on publish/edit.
export const revalidate = 3600

// On-demand ISR: cache each post after first render, revalidate hourly.
export async function generateStaticParams() {
  return []
}

const LISTINGS_HEADING: Record<string, string> = {
  'travel-guides': 'Tours & excursions',
  'beaches-nature': 'Beaches & outdoor spots',
  'food-dining': 'Restaurants & cafés',
  'culture-events': 'Nightlife & entertainment',
  'tips-practical': 'Local services',
}

async function loadPost(slug: string) {
  return db.blogPost.findFirst({
    where: { slug, status: 'published' },
    include: { category: { select: { name: true, slug: true } } },
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await loadPost(slug)
  if (!post) return { title: 'Not found' }

  const seo = await getSeoSettings()
  return buildMetadata(seo, {
    title: post.seoTitle || post.title,
    description: post.metaDescription || post.excerpt || stripHtml(post.content).slice(0, 160),
    keywords: post.primaryKeywords,
    image: post.coverImage,
    path: blogPostPath(post.slug),
    canonicalOverride: post.canonicalUrl,
    ogType: 'article',
  })
}

function formatDate(d: Date | null) {
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await loadPost(slug)
  if (!post) notFound()

  const [seo, relatedPosts, listings] = await Promise.all([
    getSeoSettings(),
    getRelatedBlogPosts({ postId: post.id, categoryId: post.categoryId, limit: 4 }),
    getBlogSidebarListings(post.category?.slug, 4),
  ])

  const { items: toc, html: contentHtml } = prepareBlogContent(post.content, post.title)
  const readTimeMinutes = estimateReadTimeMinutes(post.content)
  const listingsHeading =
    (post.category?.slug && LISTINGS_HEADING[post.category.slug]) || 'Featured in Agadir'

  const breadcrumbs = [
    { name: 'Home', url: seo.siteUrl },
    { name: 'Blog', url: `${seo.siteUrl.replace(/\/$/, '')}${blogPath()}` },
    ...(post.category
      ? [{ name: post.category.name, url: `${seo.siteUrl.replace(/\/$/, '')}${blogCategoryPath(post.category.slug)}` }]
      : []),
    { name: post.title },
  ]

  // Organization + WebSite are emitted site-wide in the root layout.
  const schemas = [
    buildBreadcrumbSchema(breadcrumbs),
    buildBlogPostingSchema({ post, siteUrl: seo.siteUrl }),
  ]

  return (
    <>
      <SchemaScript data={schemas} />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbs} className="mb-6" />

          <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_280px] gap-8 xl:gap-10 items-start">
            <aside className="hidden xl:block sticky top-24 self-start">
              <BlogPostLeftSidebar
                toc={toc}
                readTimeMinutes={readTimeMinutes}
                category={post.category}
                shareTitle={post.title}
                variant="desktop"
              />
            </aside>

            <article className="min-w-0">
              {post.coverImage ? (
                <div className="relative rounded-2xl overflow-hidden mb-6 sm:mb-8 aspect-[2/1] bg-gray-200 shadow-sm">
                  <OptimizedImage
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1280px) 100vw, 800px"
                  />
                </div>
              ) : null}

              <header className="mb-6 sm:mb-8">
                {post.category && (
                  <Link href={blogCategoryPath(post.category.slug)} className="inline-block mb-3">
                    <Badge variant="secondary" className="font-normal">
                      {post.category.name}
                    </Badge>
                  </Link>
                )}
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {post.authorName}
                  </span>
                  {post.publishedAt && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <time dateTime={post.publishedAt.toISOString()}>
                        {formatDate(post.publishedAt)}
                      </time>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {readTimeMinutes} min read
                  </span>
                </div>
                {post.excerpt && (
                  <p className="mt-4 text-lg text-muted-foreground leading-relaxed border-l-4 border-orange-400 pl-4">
                    {post.excerpt}
                  </p>
                )}
              </header>

              <BlogPostLeftSidebar
                toc={toc}
                readTimeMinutes={readTimeMinutes}
                category={post.category}
                shareTitle={post.title}
                variant="mobile"
              />

              <BlogPostContent html={contentHtml} />

              {post.primaryKeywords && (
                <p className="mt-6 text-xs text-muted-foreground">
                  Keywords: {post.primaryKeywords}
                </p>
              )}

              <div className="xl:hidden mt-8">
                <BlogPostRightSidebar
                  relatedPosts={relatedPosts}
                  listings={listings}
                  listingsHeading={listingsHeading}
                />
              </div>
            </article>

            <aside className="hidden xl:block sticky top-24 self-start">
              <BlogPostRightSidebar
                relatedPosts={relatedPosts}
                listings={listings}
                listingsHeading={listingsHeading}
              />
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}
