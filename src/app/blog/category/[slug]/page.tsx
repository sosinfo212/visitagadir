import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, Calendar, FileText, User } from 'lucide-react'
import { db } from '@/lib/db'
import { getSeoSettings } from '@/lib/seo/repository'
import { buildMetadata } from '@/lib/seo/metadata'
import { blogCategoryPath, blogPath } from '@/lib/seo/url'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  params: Promise<{ slug: string }>
}

function formatDate(d: Date | null) {
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await db.blogCategory.findUnique({ where: { slug } })
  if (!category) return { title: 'Not found' }

  const seo = await getSeoSettings()
  return buildMetadata(seo, {
    title: `${category.name} — Agadir Blog`,
    description: category.description || `Articles about ${category.name.toLowerCase()} in Agadir.`,
    path: blogCategoryPath(category.slug),
    ogType: 'website',
  })
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { slug } = await params
  const category = await db.blogCategory.findUnique({ where: { slug } })
  if (!category) notFound()

  const [posts, allCategories] = await Promise.all([
    db.blogPost.findMany({
      where: { status: 'published', categoryId: category.id },
      orderBy: { publishedAt: 'desc' },
      include: { category: { select: { name: true, slug: true } } },
    }),
    db.blogCategory.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <p className="text-sm text-orange-600 font-medium mb-2">Blog category</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground text-lg">{category.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <Link href={blogPath()}>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">All</Badge>
          </Link>
          {allCategories.map((cat) => (
            <Link key={cat.id} href={blogCategoryPath(cat.slug)}>
              <Badge
                variant={cat.slug === category.slug ? 'default' : 'outline'}
                className="cursor-pointer"
              >
                {cat.name}
              </Badge>
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No posts in this category yet.</p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <Link href={`/blog/${post.slug}`} className="block sm:flex">
                    <div className="sm:w-64 shrink-0 aspect-[16/10] sm:aspect-auto sm:min-h-[180px] bg-gradient-to-br from-orange-100 to-amber-50">
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
                    <div className="p-6 flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 hover:text-orange-600 transition-colors mb-2">
                        {post.title}
                      </h2>
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
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
