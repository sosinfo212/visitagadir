import Link from 'next/link'
import { Calendar, FileText, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { blogCategoryPath, blogPostPath } from '@/lib/seo/url'
import type { BlogPostCardData } from '@/lib/blog/blog-list-data'
import { OptimizedImage } from '@/components/optimized-image'

function formatDate(d: Date | null) {
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function BlogPostCard({ post }: { post: BlogPostCardData }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="block sm:flex">
          <Link
            href={blogPostPath(post.slug)}
            className="sm:w-64 shrink-0 block"
            aria-label={`Read article: ${post.title}`}
          >
            <div className="relative aspect-[16/10] sm:aspect-auto sm:min-h-[180px] bg-gradient-to-br from-orange-100 to-amber-50">
              {post.coverImage ? (
                <OptimizedImage
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 256px"
                  className="object-cover"
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
            <Link href={blogPostPath(post.slug)}>
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
  )
}
