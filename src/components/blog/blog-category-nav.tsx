import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { blogCategoryPath, blogPath } from '@/lib/seo/url'
import type { BlogCategoryNavItem } from '@/lib/blog/blog-list-data'

interface BlogCategoryNavProps {
  categories: BlogCategoryNavItem[]
  activeCategorySlug?: string | null
  variant?: 'badges' | 'sidebar'
}

export function BlogCategoryNav({
  categories,
  activeCategorySlug,
  variant = 'badges',
}: BlogCategoryNavProps) {
  if (categories.length === 0) return null

  if (variant === 'sidebar') {
    return (
      <ul className="space-y-1 text-sm">
        <li>
          <Link
            href={blogPath()}
            className={`block rounded-lg px-3 py-2 transition-colors ${
              !activeCategorySlug
                ? 'bg-orange-50 text-orange-700 font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            All articles
          </Link>
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link
              href={blogCategoryPath(cat.slug)}
              className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-colors ${
                activeCategorySlug === cat.slug
                  ? 'bg-orange-50 text-orange-700 font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span className="truncate">{cat.name}</span>
              <span className="text-xs tabular-nums shrink-0">{cat.postCount}</span>
            </Link>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <Link href={blogPath()}>
        <Badge variant={!activeCategorySlug ? 'default' : 'outline'} className="cursor-pointer">
          All
        </Badge>
      </Link>
      {categories.map((cat) => (
        <Link key={cat.id} href={blogCategoryPath(cat.slug)}>
          <Badge
            variant={activeCategorySlug === cat.slug ? 'default' : 'outline'}
            className="cursor-pointer"
          >
            {cat.name}
          </Badge>
        </Link>
      ))}
    </div>
  )
}
