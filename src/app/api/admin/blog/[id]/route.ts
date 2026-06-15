import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { isValidSlug } from '@/lib/blog/slug'

async function resolveCategoryId(raw: unknown) {
  const categoryId = String(raw ?? '').trim()
  if (!categoryId) return { error: 'Category is required.' as const }

  const category = await db.blogCategory.findUnique({ where: { id: categoryId } })
  if (!category) return { error: 'Selected category does not exist.' as const }

  return { categoryId }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const post = await db.blogPost.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true, slug: true } } },
    })
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(post)
  } catch (error) {
    console.error('Fetch blog post error:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    const title = String(body.title ?? '').trim()
    const slug = String(body.slug ?? '').trim()
    const content = String(body.content ?? '').trim()

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'Title, slug, and content are required.' }, { status: 400 })
    }
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Invalid slug format.' }, { status: 400 })
    }

    const category = await resolveCategoryId(body.categoryId)
    if ('error' in category) {
      return NextResponse.json({ error: category.error }, { status: 400 })
    }

    const duplicate = await db.blogPost.findFirst({
      where: { slug, NOT: { id } },
    })
    if (duplicate) {
      return NextResponse.json({ error: 'Slug already exists.' }, { status: 409 })
    }

    const status = body.status === 'published' ? 'published' : 'draft'
    const publishedAt =
      status === 'published'
        ? body.publishedAt
          ? new Date(String(body.publishedAt))
          : new Date()
        : null

    const post = await db.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        categoryId: category.categoryId,
        excerpt: String(body.excerpt ?? '').trim() || null,
        coverImage: String(body.coverImage ?? '').trim() || null,
        authorName: String(body.authorName ?? 'Agadir Directory').trim() || 'Agadir Directory',
        status,
        publishedAt,
        primaryKeywords: String(body.primaryKeywords ?? '').trim() || null,
        seoTitle: String(body.seoTitle ?? '').trim() || null,
        metaDescription: String(body.metaDescription ?? '').trim() || null,
        canonicalUrl: String(body.canonicalUrl ?? '').trim() || null,
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Update blog post error:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await db.blogPost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete blog post error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
