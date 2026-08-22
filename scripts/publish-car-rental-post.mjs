import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const meta = 'How to rent a car in Agadir — airport vs city agencies, 2026 rates, no-deposit (sans caution) options, insurance tips and the best local companies.'
const p = await prisma.blogPost.update({
  where: { slug: 'car-rental-agadir-guide' },
  data: { status: 'published', publishedAt: new Date(), metaDescription: meta },
  select: { slug: true, status: true, publishedAt: true },
})
console.log('published:', p.slug, p.status, p.publishedAt, '| meta len:', meta.length)
await prisma.$disconnect()
