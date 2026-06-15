import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { slugify, isValidSlug } from '@/lib/blog/slug'
import { ensureDefaultBlogCategories } from '@/lib/blog/ensure-categories'

async function resolveCategoryId(raw: unknown) {
  const categoryId = String(raw ?? '').trim()
  if (!categoryId) return { error: 'Category is required.' as const }

  const category = await db.blogCategory.findUnique({ where: { id: categoryId } })
  if (!category) return { error: 'Selected category does not exist.' as const }

  return { categoryId }
}

function buildPostData(body: Record<string, unknown>, categoryId: string) {
  const title = String(body.title ?? '').trim()
  const slug = String(body.slug ?? '').trim()
  const content = String(body.content ?? '').trim()

  if (!title || !slug || !content) {
    return { error: 'Title, slug, and content are required.' as const }
  }
  if (!isValidSlug(slug)) {
    return { error: 'Slug must be lowercase letters, numbers, and hyphens only.' as const }
  }

  const status = body.status === 'published' ? 'published' : 'draft'
  const publishedAt =
    status === 'published'
      ? body.publishedAt
        ? new Date(String(body.publishedAt))
        : new Date()
      : null

  return {
    data: {
      title,
      slug,
      content,
      categoryId,
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
  }
}

export async function GET(request: NextRequest) {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
        { excerpt: { contains: search } },
      ]
    }

    const posts = await db.blogPost.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: { category: { select: { id: true, name: true, slug: true } } },
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Fetch blog posts error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    await ensureDefaultBlogCategories()

    const category = await resolveCategoryId(body.categoryId)
    if ('error' in category) {
      return NextResponse.json({ error: category.error }, { status: 400 })
    }

    const built = buildPostData(body, category.categoryId)
    if ('error' in built) {
      return NextResponse.json({ error: built.error }, { status: 400 })
    }

    const existing = await db.blogPost.findUnique({ where: { slug: built.data.slug } })
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists.' }, { status: 409 })
    }

    const post = await db.blogPost.create({
      data: built.data,
      include: { category: { select: { id: true, name: true, slug: true } } },
    })
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Create blog post error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}