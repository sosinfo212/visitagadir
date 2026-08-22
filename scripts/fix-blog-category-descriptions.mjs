/**
 * One-off: replace "Imported from WordPress (…)" placeholder descriptions on
 * blog categories with proper Agadir-tailored descriptions (drives the
 * /blog/category/<slug> subtitle + meta/og/twitter description). Also fixes the
 * "Intertainment" name typo → "Entertainment" (slug/URL unchanged).
 * Uncategorized is intentionally left out.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// slug -> { description, name? }
const UPDATES = {
  afcon: { description: 'AFCON 2025 in Agadir — fixtures, fan guides, and match-day travel tips for the Africa Cup of Nations.' },
  business: { description: 'Agadir business news and directory insights — services, openings, and the Souss-Massa economy.' },
  disaster: { description: 'Weather alerts, floods, and emergency news affecting Agadir and southern Morocco.' },
  education: { description: 'Universities, schools, and learning in Agadir — Ibn Zohr and study options in Souss-Massa.' },
  food: { description: 'Where to eat in Agadir — restaurants, cafés, Moroccan cuisine, and local food guides.' },
  intertainment: { name: 'Entertainment', description: 'Nightlife, events, and things to do after dark in Agadir, Morocco.' },
  'news-worldwide': { description: 'World and Morocco news relevant to visitors and residents of Agadir.' },
  shopping: { description: 'Shopping in Agadir — souks, malls, markets, and the best local finds.' },
  sport: { description: 'Sport in Agadir — football, water sports, golf, and local athletic news.' },
  tips: { description: 'Practical tips for visiting Agadir — getting around, safety, budgets, and local know-how.' },
  'travel-tour': { description: 'Agadir travel guides, day trips, and tours across southern Morocco — Taghazout, Paradise Valley, and beyond.' },
}

let updated = 0
for (const [slug, data] of Object.entries(UPDATES)) {
  const row = await prisma.blogCategory.findUnique({ where: { slug }, select: { id: true, name: true } })
  if (!row) {
    console.log(`SKIP  ${slug} (not found)`)
    continue
  }
  await prisma.blogCategory.update({ where: { slug }, data })
  updated++
  console.log(`OK    ${slug}${data.name ? ` (renamed ${row.name} -> ${data.name})` : ''}`)
}

console.log(`\nUpdated ${updated} categories.`)
const remaining = await prisma.blogCategory.count({ where: { description: { contains: 'Imported from WordPress' } } })
console.log(`Categories still holding the WP placeholder: ${remaining} (expected: 1 = Uncategorized)`)

await prisma.$disconnect()
