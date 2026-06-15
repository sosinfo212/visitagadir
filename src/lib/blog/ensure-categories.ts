import { db } from '@/lib/db'
import { DEFAULT_BLOG_CATEGORIES } from '@/lib/blog/categories'

/** Ensures default blog categories exist. */
export async function ensureDefaultBlogCategories() {
  for (const cat of DEFAULT_BLOG_CATEGORIES) {
    await db.blogCategory.upsert({
      where: { slug: cat.slug },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
      },
      update: {
        name: cat.name,
        description: cat.description,
      },
    })
  }
}
