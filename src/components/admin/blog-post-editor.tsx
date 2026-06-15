'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BlogSeoSidebar, type BlogSeoFields } from '@/components/admin/blog-seo-sidebar'
import { slugify } from '@/lib/blog/slug'

const WordPressEditor = dynamic(
  () => import('@/components/admin/wordpress-editor').then((m) => m.WordPressEditor),
  {
    ssr: false,
    loading: () => <div className="h-[480px] rounded-sm border border-[#c3c4c7] bg-white animate-pulse" />,
  },
)

export interface PostForm extends BlogSeoFields {
  content: string
}

export const emptyPostForm: PostForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  categoryId: '',
  authorName: 'Agadir Directory',
  status: 'draft',
  primaryKeywords: '',
  metaDescription: '',
  seoTitle: '',
  canonicalUrl: '',
}

interface BlogCategoryOption {
  id: string
  name: string
  slug: string
}

interface BlogPostEditorProps {
  postId?: string
  initialForm?: PostForm
  pageTitle: string
}

export function BlogPostEditor({ postId, initialForm = emptyPostForm, pageTitle }: BlogPostEditorProps) {
  const router = useRouter()
  const [form, setForm] = useState<PostForm>(initialForm)
  const [categories, setCategories] = useState<BlogCategoryOption[]>([])
  const [slugTouched, setSlugTouched] = useState(!!postId)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/blog/categories')
      .then(async (res) => {
        if (!res.ok) return
        const data = (await res.json()) as BlogCategoryOption[]
        setCategories(data)
        setForm((prev) => {
          if (prev.categoryId || !data[0]) return prev
          return { ...prev, categoryId: data[0].id }
        })
      })
      .catch(() => {})
  }, [postId])

  function updateForm(patch: Partial<PostForm>) {
    if (patch.slug !== undefined) setSlugTouched(true)
    setForm((prev) => {
      const next = { ...prev, ...patch }
      if (patch.title !== undefined && !slugTouched) {
        next.slug = slugify(patch.title)
      }
      return next
    })
  }

  async function handleSave() {
    if (!form.categoryId) {
      alert('Please select a category.')
      return
    }

    setSaving(true)
    try {
      const url = postId ? `/api/admin/blog/${postId}` : '/api/admin/blog'
      const method = postId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to save')
        return
      }
      await res.json()
      router.push('/admin/blog')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/blog">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{pageTitle}</h1>
            <p className="text-muted-foreground text-sm">WordPress-style editor with live SEO scoring.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/blog">Cancel</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {postId ? 'Save changes' : 'Create post'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="flex-1 space-y-5 min-w-0 w-full">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => updateForm({ title: e.target.value })}
              placeholder="Post title"
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <WordPressEditor
              value={form.content}
              onChange={(html) => updateForm({ content: html })}
              minHeight={480}
            />
          </div>
        </div>

        <BlogSeoSidebar
          fields={form}
          categories={categories}
          onChange={updateForm}
        />
      </div>
    </div>
  )
}
