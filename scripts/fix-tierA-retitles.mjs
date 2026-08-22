import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const U = {
  'best-agadir-marina-restaurants-to-try': {
    seoTitle: 'Best Agadir Marina Restaurants (2026): Seafood & Views',
    metaDescription: 'Where to eat at Agadir Marina — the best seafood, Moroccan and international restaurants with harbour views, plus prices and booking tips for 2026.',
  },
  'best-cafes-in-agadir': {
    seoTitle: 'Best Cafés in Agadir (2026): Coffee, Brunch & Views',
    metaDescription: 'The best cafés in Agadir for coffee, breakfast and brunch — from seafront terraces to cosy spots locals love. Where to go and what to order.',
  },
  'agadir-public-transport-guide': {
    seoTitle: 'How to Get Around Agadir: Buses, Taxis & 2026 Fares',
    metaDescription: 'Getting around Agadir — city buses, petit and grand taxis, fares, and airport transfers. A practical 2026 guide to moving around Agadir cheaply.',
  },
}
for (const [slug, data] of Object.entries(U)) {
  const r = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } })
  if (!r) { console.log('SKIP', slug); continue }
  await prisma.blogPost.update({ where: { slug }, data })
  console.log(`OK ${slug} -> ${data.seoTitle} (${data.seoTitle.length})`)
}
await prisma.$disconnect()
