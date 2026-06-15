import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, Calendar, FileText, User } from 'lucide-react'
import { db } from '@/lib/db'
import { getSeoSettings } from '@/lib/seo/repository'
import { buildMetadata } from '@/lib/seo/metadata'
import { blogCategoryPath, blogPath } from '@/lib/seo/url'
import { ensureDefaultBlogCategories } from '@/lib/blog/ensure-categories'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings()
  return buildMetadata(seo, {
    title: 'Blog — Agadir Travel & Local Guides',
    description: 'Tips, guides, and stories about Agadir — beaches, restaurants, culture, and things to do in Morocco.',
    path: blogPath(),
    ogType: 'website',
  })
}

function formatDate(d: Date | null) {
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface BlogPageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  await ensureDefaultBlogCategories()
  const { category: categorySlug } = await searchParams

  const [categories, posts] = await Promise.all([
    db.blogCategory.findMany({ orderBy: { name: 'asc' } }),
    db.blogPost.findMany({
      where: {
        status: 'published',
        ...(categorySlug
          ? { category: { slug: categorySlug } }
          : {}),
      },
      orderBy: { publishedAt: 'desc' },
      include: { category: { select: { name: true, slug: true } } },
    }),
  ])

  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {activeCategory ? activeCategory.name : 'Agadir Blog'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {activeCategory?.description || 'Guides, tips, and local insights for visitors and residents.'}
          </p>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link href={blogPath()}>
              <Badge variant={!categorySlug ? 'default' : 'outline'} className="cursor-pointer">
                All
              </Badge>
            </Link>
            {categories.map((cat) => (
              <Link key={cat.id} href={blogCategoryPath(cat.slug)}>
                <Badge
                  variant={categorySlug === cat.slug ? 'default' : 'outline'}
                  className="cursor-pointer"
                >
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No posts published yet. Check back soon.</p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="block sm:flex">
                    <Link href={`/blog/${post.slug}`} className="sm:w-64 shrink-0 block">
                      <div className="aspect-[16/10] sm:aspect-auto sm:min-h-[180px] bg-gradient-to-br from-orange-100 to-amber-50">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full min-h-[160px] flex items-center justify-center text-orange-300">
                            <FileText className="h-12 w-12" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-6 flex-1">
                      {post.category && (
                        <Link href={blogCategoryPath(post.category.slug)} className="inline-block mb-2">
                          <Badge variant="secondary" className="font-normal hover:bg-secondary/80">
                            {post.category.name}
                          </Badge>
                        </Link>
                      )}
                      <Link href={`/blog/${post.slug}`}>
                        <h2 className="text-xl font-semibold text-gray-900 hover:text-orange-600 transition-colors mb-2">
                          {post.title}
                        </h2>
                      </Link>
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {post.authorName}
                        </span>
                        {post.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(post.publishedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
