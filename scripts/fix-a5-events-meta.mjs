import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const seoTitle = "Agadir Events 2026: Festivals, Concerts & What's On"
const metaDescription = "What's on in Agadir — festivals, concerts, markets, surf contests and family events across the coast. Your month-by-month 2026 guide to Agadir events."
const row = await prisma.blogPost.findUnique({ where: { slug: 'agadir-local-events-calendar' }, select: { id: true, seoTitle: true } })
if (row) {
  console.log('BEFORE:', row.seoTitle)
  await prisma.blogPost.update({ where: { slug: 'agadir-local-events-calendar' }, data: { seoTitle, metaDescription } })
  console.log(`AFTER (${seoTitle.length}):`, seoTitle)
  console.log(`meta (${metaDescription.length})`)
} else console.log('not found')
await prisma.$disconnect()
