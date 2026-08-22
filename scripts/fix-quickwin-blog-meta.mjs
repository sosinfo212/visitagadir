/**
 * Quick-win title/meta rewrites for 4 blog posts ranking page-1 with ~0 clicks
 * (GSC 28-day data). Keyword-first, natural, +year, benefit hook; meta 130-150
 * chars, active, no quotes, unique. seoTitle excludes brand (titleTemplate adds it).
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const UPDATES = {
  'best-rooftop-restaurants-agadir': {
    seoTitle: 'Best Rooftop Restaurants in Agadir (2026): Views & Menus',
    metaDescription:
      "Discover Agadir's best rooftop restaurants — sunset dining, marina views and terrace bars. See where to eat, drink and watch the sun go down.",
  },
  'best-romantic-dinners-agadir': {
    seoTitle: 'Best Romantic Restaurants in Agadir for Date Night 2026',
    metaDescription:
      'The most romantic restaurants in Agadir for a date night — oceanfront tables, candlelit lounges and hidden gems couples love. Plan your evening.',
  },
  'best-cafes-for-remote-work-in-agadir': {
    seoTitle: 'Best Cafés for Remote Work in Agadir: WiFi & Quiet Spots',
    metaDescription:
      'Where to work remotely in Agadir: the best cafés for fast WiFi, power outlets, quiet seating and good coffee. Find your spot by neighborhood.',
  },
  'best-brunch-spots-agadir': {
    seoTitle: 'Best Brunch Spots in Agadir (2026): Where Locals Eat',
    metaDescription:
      'The best brunch spots in Agadir — beach cafés, stylish terraces and great coffee. Where locals go for weekend brunch, plus tips on when to visit.',
  },
}

for (const [slug, data] of Object.entries(UPDATES)) {
  const row = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } })
  if (!row) { console.log(`SKIP ${slug} (not found)`); continue }
  await prisma.blogPost.update({ where: { slug }, data })
  console.log(`OK   ${slug}`)
  console.log(`     title(${data.seoTitle.length}): ${data.seoTitle}`)
  console.log(`     meta(${data.metaDescription.length}):  ${data.metaDescription}`)
}
await prisma.$disconnect()
