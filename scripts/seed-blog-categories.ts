import { db } from '@/lib/db'
import { DEFAULT_BLOG_CATEGORIES } from '@/lib/blog/categories'

async function main() {
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

  console.log('Blog categories ready.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
