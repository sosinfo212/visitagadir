import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { slugify, isValidSlug } from '@/lib/blog/slug'
import { ensureDefaultBlogCategories } from '@/lib/blog/ensure-categories'

export async function GET() {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureDefaultBlogCategories()

    const categories = await db.blogCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { posts: true } } },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Fetch blog categories error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const slug = String(body.slug ?? '').trim() || slugify(name)
    const description = String(body.description ?? '').trim() || null

    if (!name) {
      return NextResponse.json({ error: 'Category name is required.' }, { status: 400 })
    }
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Invalid slug format.' }, { status: 400 })
    }

    const existing = await db.blogCategory.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists.' }, { status: 409 })
    }

    const category = await db.blogCategory.create({
      data: { name, slug, description },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Create blog category error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
