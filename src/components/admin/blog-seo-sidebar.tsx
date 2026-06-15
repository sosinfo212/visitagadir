'use client'

import { useMemo } from 'react'
import { CheckCircle2, AlertCircle, XCircle, TrendingUp } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { calculateBlogSeoScore } from '@/lib/blog/seo-score'
import { FeaturedImageInput } from '@/components/admin/featured-image-input'
import { cn } from '@/lib/utils'

export interface BlogSeoFields {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  categoryId: string
  authorName: string
  status: 'draft' | 'published'
  primaryKeywords: string
  metaDescription: string
  seoTitle: string
  canonicalUrl: string
}

interface BlogCategoryOption {
  id: string
  name: string
}

interface BlogSeoSidebarProps {
  fields: BlogSeoFields
  categories: BlogCategoryOption[]
  onChange: (patch: Partial<BlogSeoFields>) => void
}

const statusIcon = {
  pass: CheckCircle2,
  warning: AlertCircle,
  fail: XCircle,
}

const statusColor = {
  pass: 'text-emerald-600',
  warning: 'text-amber-600',
  fail: 'text-red-600',
}

export function BlogSeoSidebar({ fields, categories, onChange }: BlogSeoSidebarProps) {
  const result = useMemo(
    () =>
      calculateBlogSeoScore({
        title: fields.title,
        slug: fields.slug,
        excerpt: fields.excerpt,
        content: fields.content,
        coverImage: fields.coverImage,
        primaryKeywords: fields.primaryKeywords,
        metaDescription: fields.metaDescription,
        seoTitle: fields.seoTitle,
      }),
    [fields],
  )

  const gradeColor =
    result.score >= 90
      ? 'text-emerald-600'
      : result.score >= 75
        ? 'text-blue-600'
        : result.score >= 60
          ? 'text-amber-600'
          : 'text-red-600'

  return (
    <aside className="w-full xl:w-[340px] shrink-0 space-y-4">
      <div className="rounded-xl border bg-card p-4 space-y-4 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div>
          <h3 className="font-semibold text-sm mb-3">Post settings</h3>
          <div className="space-y-4">
            <FeaturedImageInput
              value={fields.coverImage ?? ''}
              onChange={(coverImage) => onChange({ coverImage })}
            />

            <div className="space-y-2">
              <Label htmlFor="blog-excerpt">Excerpt</Label>
              <Textarea
                id="blog-excerpt"
                value={fields.excerpt}
                onChange={(e) => onChange({ excerpt: e.target.value })}
                rows={2}
                placeholder="Short summary for the blog listing…"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={fields.categoryId || undefined}
                onValueChange={(categoryId) => onChange({ categoryId })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={fields.status}
                onValueChange={(v: 'draft' | 'published') => onChange({ status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-author">Author</Label>
              <Input
                id="blog-author"
                value={fields.authorName}
                onChange={(e) => onChange({ authorName: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-600" />
            <h3 className="font-semibold text-sm">SEO Score</h3>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className={cn('text-3xl font-bold tabular-nums', gradeColor)}>{result.score}</p>
              <p className="text-xs text-muted-foreground">{result.grade}</p>
            </div>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
          <Progress value={result.score} className="h-2" />

          <ul className="space-y-2 max-h-52 overflow-y-auto text-xs">
            {result.checks.map((c) => {
              const Icon = statusIcon[c.status]
              return (
                <li key={`${c.title}-${c.message}`} className="flex gap-2 items-start">
                  <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', statusColor[c.status])} />
                  <span>
                    <span className="font-medium">{c.title}: </span>
                    {c.message}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="border-t pt-4 space-y-4">
          <h3 className="font-semibold text-sm">SEO settings</h3>

          <div className="space-y-2">
            <Label htmlFor="blog-slug">URL slug</Label>
            <Input
              id="blog-slug"
              value={fields.slug}
              onChange={(e) => onChange({ slug: e.target.value })}
              placeholder="best-beaches-agadir"
            />
            <p className="text-xs text-muted-foreground">/blog/{fields.slug || 'your-slug'}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-primary-kw">Primary keyword</Label>
            <Input
              id="blog-primary-kw"
              value={fields.primaryKeywords}
              onChange={(e) => onChange({ primaryKeywords: e.target.value })}
              placeholder="agadir beaches"
            />
            <p className="text-xs text-muted-foreground">Focus keyphrase for SEO scoring.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-seo-title">Meta title</Label>
            <Input
              id="blog-seo-title"
              value={fields.seoTitle}
              onChange={(e) => onChange({ seoTitle: e.target.value })}
              placeholder={fields.title || 'Custom title for search results'}
            />
            <p className="text-xs text-muted-foreground">
              {(fields.seoTitle || fields.title).length} chars
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-meta">Meta description</Label>
            <Textarea
              id="blog-meta"
              value={fields.metaDescription}
              onChange={(e) => onChange({ metaDescription: e.target.value })}
              rows={3}
              placeholder="Short summary for Google search results…"
            />
            <p className="text-xs text-muted-foreground">
              {fields.metaDescription.length} chars (aim 120–160)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blog-canonical">Canonical URL (optional)</Label>
            <Input
              id="blog-canonical"
              value={fields.canonicalUrl}
              onChange={(e) => onChange({ canonicalUrl: e.target.value })}
              placeholder="https://…"
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
