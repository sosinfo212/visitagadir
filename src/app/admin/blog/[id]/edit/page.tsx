'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { BlogPostEditor, emptyPostForm, type PostForm } from '@/components/admin/blog-post-editor'

export default function EditBlogPostPage() {
  const params = useParams()
  const id = params.id as string
  const [form, setForm] = useState<PostForm | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/blog/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Post not found')
        const post = await res.json()
        setForm({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? '',
          content: post.content,
          coverImage: post.coverImage ?? '',
          categoryId: post.categoryId ?? post.category?.id ?? '',
          authorName: post.authorName,
          status: post.status === 'published' ? 'published' : 'draft',
          primaryKeywords: post.primaryKeywords ?? '',
          metaDescription: post.metaDescription ?? '',
          seoTitle: post.seoTitle ?? '',
          canonicalUrl: post.canonicalUrl ?? '',
        })
      })
      .catch(() => setError('Failed to load post'))
  }, [id])

  if (error) {
    return <p className="text-center text-muted-foreground py-16">{error}</p>
  }

  if (!form) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <BlogPostEditor
      postId={id}
      initialForm={form}
      pageTitle="Edit post"
    />
  )
}
