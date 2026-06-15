import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { slugify, isValidSlug } from '@/lib/blog/slug'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await isAuthenticated()
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const category = await db.blogCategory.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } },
    })
    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Fetch blog category error:', error)
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 })
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
    const name = String(body.name ?? '').trim()
    const slug = String(body.slug ?? '').trim() || slugify(name)
    const description = String(body.description ?? '').trim() || null

    if (!name) {
      return NextResponse.json({ error: 'Category name is required.' }, { status: 400 })
    }
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Invalid slug format.' }, { status: 400 })
    }

    const duplicate = await db.blogCategory.findFirst({
      where: { slug, NOT: { id } },
    })
    if (duplicate) {
      return NextResponse.json({ error: 'Slug already exists.' }, { status: 409 })
    }

    const category = await db.blogCategory.update({
      where: { id },
      data: { name, slug, description },
      include: { _count: { select: { posts: true } } },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Update blog category error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
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
    const postCount = await db.blogPost.count({ where: { categoryId: id } })
    if (postCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${postCount} post(s) still use this category. Reassign them first.` },
        { status: 409 },
      )
    }

    await db.blogCategory.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete blog category error:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
