/**
 * Backfill category descriptions from the canonical seed catalog.
 * Updates rows where description is empty or still has the WordPress import placeholder.
 *
 * Usage: npx tsx scripts/backfill-category-descriptions.ts
 */

import { PrismaClient } from '@prisma/client'

const DESCRIPTIONS: Record<string, string> = {
  'restaurants-cafes':
    'Discover the best restaurants and cafés in Agadir. From traditional Moroccan cuisine to international flavors, find your perfect dining experience.',
  'hotels-accommodation':
    'Find the perfect place to stay in Agadir. Luxury resorts, cozy guesthouses, and budget-friendly options along the beautiful coastline.',
  'beaches-water-sports':
    "Explore Agadir's stunning beaches and exciting water sports. Surfing, jet skiing, boat tours, and relaxing beach clubs await you.",
  'shopping-markets':
    "Shop at Agadir's vibrant markets and modern malls. From traditional souks to luxury boutiques, find everything you need.",
  'health-wellness':
    'Find healthcare providers, spas, and wellness centers in Agadir. From hospitals to hammams, your health and wellbeing are covered.',
  'education-training':
    'Discover schools, universities, language centers, and professional training institutes in Agadir.',
  'transport-car-rental':
    'Get around Agadir with ease. Car rentals, taxis, bus services, and airport transfers all in one place.',
  'professional-services':
    'Find lawyers, accountants, real estate agents, and other professional services in Agadir.',
  'nightlife-entertainment':
    'Experience Agadir after dark. Bars, clubs, casinos, and live entertainment venues for unforgettable nights.',
  'tours-excursions':
    'Book unforgettable tours and excursions from Agadir. Desert safaris, mountain trips, and coastal adventures.',
  'home-services':
    'Find plumbers, electricians, cleaning services, and other home service providers in Agadir.',
  'beauty-personal-care':
    'Discover hair salons, barbershops, nail studios, and beauty centers in Agadir.',
}

function needsDescription(description: string | null): boolean {
  if (!description?.trim()) return true
  return description.startsWith('Imported from WordPress')
}

async function main() {
  const db = new PrismaClient()
  let updated = 0
  let skipped = 0

  try {
    const categories = await db.category.findMany({
      select: { id: true, slug: true, name: true, description: true },
    })

    for (const category of categories) {
      const nextDescription = DESCRIPTIONS[category.slug]
      if (!nextDescription) {
        skipped++
        continue
      }
      if (!needsDescription(category.description)) {
        skipped++
        continue
      }

      await db.category.update({
        where: { id: category.id },
        data: { description: nextDescription },
      })
      updated++
      console.log(`Updated ${category.slug}`)
    }

    console.log(`Done. Updated ${updated}, skipped ${skipped}.`)
  } finally {
    await db.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
