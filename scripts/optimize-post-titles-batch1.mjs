/**
 * CTR/SEO title + meta optimisation for the traffic-getting posts (GSC 28d),
 * each matched to the post's actual top search query. Skips posts already
 * optimised and exact-duplicate posts that need consolidation instead.
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const M = {
  'agadirs-green-oasis-a-guide-to-public-parks': ['Best Parks & Green Spaces in Agadir (2026): Picnic Spots', "Agadir's best parks and gardens for a picnic or a stroll — Jardin de Olhão, Vallée des Oiseaux and more, with what to see and when to go."],
  'agadir-cable-car-review': ['Agadir Oufella Cable Car (2026): Tickets, Views & Review', 'Riding the Agadir Oufella cable car — ticket prices, timings, the view from the top and whether it is worth it. A first-hand 2026 review.'],
  'agadir-or-taghazout-stay': ['Agadir or Taghazout: Where to Stay (2026 Guide)', 'Agadir vs Taghazout — which should you base your trip in? Beaches, surf, nightlife, prices and vibe compared to help you decide where to stay.'],
  'agadir-attractions-guide': ['Top Agadir Attractions (2026): What to See & Do', 'The top tourist attractions in Agadir — the beach, Kasbah Oufella, Souk El Had, the Marina and more, with tips on what to see and how long to spend.'],
  'best-family-friendly-hotels-agadir': ['Best Family Hotels in Agadir (2026): Kid-Friendly Stays', 'The best family-friendly hotels and resorts in Agadir — pools, kids clubs, beachfront and great-value picks for a family holiday in Morocco.'],
  'the-amalway-agadir-trambus-project': ['Amalway Agadir: The New Trambus (BRT) Explained', "Everything about Amalway, Agadir's new bus rapid transit — routes, stations, fares and what the trambus means for getting around the city."],
  'discovering-agadirs-shopping-paradises': ['Best Shopping Malls in Agadir (2026): Where to Shop', "Agadir's best shopping malls and centres — Marjane, Souk El Had and more, with what to find, opening hours and where to go for what."],
  'best-restaurants-in-agadir': ['Best Restaurants in Agadir (2026): Where to Eat', 'The best restaurants in Agadir — seafood, Moroccan, international and local favourites, with prices and where to book for every budget.'],
  'agadir-golf-courses': ['Agadir Golf Courses (2026): The Best Places to Play', 'Golf in Agadir — Golf du Soleil, Les Dunes and more, with green fees, course layouts and tips for playing golf in Agadir, Morocco.'],
  'surfing-lessons-for-beginners': ['Surf Lessons in Agadir for Beginners (2026)', 'Learn to surf in Agadir and Taghazout — the best beginner surf schools, lesson prices, what to expect and the safest beaches to start on.'],
  'top-hotels-in-agadir-where-comfort-meets-elegance': ['Best Hotels in Agadir (2026): Where to Stay', 'The best hotels in Agadir — beachfront resorts, boutique stays and value picks, with what to expect and where to book for your trip.'],
  'how-to-explore-agadir-corniche': ['Agadir Corniche & Beach Promenade: Guide (2026)', "A guide to Agadir's Corniche and beach promenade — where to walk, the best cafés and viewpoints, and what to see along the seafront."],
  'best-family-beaches-agadir': ['Best Family Beaches in Agadir (2026): Safe & Sandy', "Agadir's best family beaches — calm, sandy and safe for kids, with facilities, shade and where to set up for the day."],
  'top-day-trips-from-agadir-explore-moroccos-hidden-gems': ['Best Day Trips from Agadir (2026): Where to Go', 'The best day trips from Agadir — Paradise Valley, Taroudant, Essaouira, Souss-Massa and more, with distances, transport and timing.'],
  'agadir-souk-shopping-guide': ['Souk El Had Agadir: Shopping Guide (2026)', 'How to shop Souk El Had, Agadir’s huge market — what to buy, where to find it, opening days, prices and haggling tips for visitors.'],
  'agadir-beach-clubs-review-where-to-go': ['Best Beach Clubs in Agadir (2026): Where to Go', "Agadir's best beach clubs — pools, loungers, food and sunset spots, with prices and which club suits couples, families or a party."],
  'agadir-airport-transfer-options': ['Agadir Airport Transfers (2026): Options & Prices', 'Getting from Al Massira Airport to Agadir — private transfers, taxis, car rental and buses compared, with prices and journey times.'],
  'is-it-cheap-to-eat-out-in-agadir': ['Is Eating Out in Agadir Cheap? Prices & Tips (2026)', 'How much does eating out in Agadir cost? Real 2026 price ranges for street food, cafés and restaurants, plus where to eat well for less.'],
  'best-taghazout-restaurants': ['Best Restaurants in Taghazout (2026): Where to Eat', 'The best restaurants and cafés in Taghazout — surf-town brunch spots, seafood and healthy bowls, with what to try and where to go.'],
  'hidden-gems-in-agadir': ['Hidden Gems in Agadir (2026): Secret Local Spots', "Agadir's hidden gems beyond the beach — quiet viewpoints, local eateries and spots most tourists miss, from a local's perspective."],
  'is-agadir-too-hot-in-july': ['Is Agadir Too Hot in July? Weather Guide (2026)', "Agadir in July — real temperatures, sea breeze, humidity and what to expect, plus whether it is too hot and how to plan your days."],
  'marina-agadir-visitor-guide': ['Agadir Marina: Visitor Guide (2026) — What to Do', "A visitor guide to Agadir Marina — restaurants, cafés, boat trips and the walk, with the best things to do and when to visit."],
  'what-to-eat-agadir': ['What to Eat in Agadir (2026): Local Food Guide', 'What to eat in Agadir — tagine, fresh grilled fish, msemen, amlou and more, with the local dishes to try and where to find them.'],
  'agadir-moroccos-hidden-gem': ["Why Agadir Is Morocco's Coastal Gem (2026)", 'Why Agadir is one of Morocco’s best coastal destinations — beaches, sunshine, food and value, and what makes it worth visiting in 2026.'],
  'top-family-activities-agadir-visitors': ['Things to Do in Agadir with Kids (2026): Family Fun', 'The best things to do in Agadir with kids — beaches, the cable car, mini-golf, Crocoparc and more family activities for all ages.'],
  'things-to-do-in-agadir': ['Things to Do in Agadir (2026): Top Things to See', 'The top things to do in Agadir — beaches, Kasbah Oufella, Souk El Had, the Marina, day trips and more, planned for first-time visitors.'],
  'best-neighborhoods-in-agadir': ['Best Neighbourhoods in Agadir (2026): Where to Stay', 'The best neighbourhoods in Agadir for your stay — beachfront, city centre, Founty and more, with the vibe and who each suits.'],
  'agadir-marina-cafe-jour-et-nuit': ['Café Jour et Nuit, Agadir Marina — Review (2026)', 'Café Jour et Nuit at Agadir Marina — the view, the menu, coffee and prices, plus what to expect and the best time to go.'],
  'agadirs-historic-kasbah-oufella': ['Kasbah Oufella Agadir (2026): Views, History & Tips', "Agadir's historic Kasbah Oufella — the panoramic view, its history, how to get up there and the best time to visit for photos."],
  'how-much-is-a-taxi-from-agadir-to-taghazout': ['Agadir to Taghazout Taxi (2026): Prices & Options', 'How much is a taxi from Agadir to Taghazout? Real grand-taxi and private-transfer prices, journey time and cheaper ways to get there.'],
  'tamraght-cafes-and-restaurants': ['Best Cafés & Restaurants in Tamraght (2026)', 'Where to eat in Tamraght — the best cafés, brunch spots and restaurants in this surf village near Agadir, with what to try.'],
}

let n = 0
const long = []
for (const [slug, [seoTitle, metaDescription]] of Object.entries(M)) {
  const r = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } })
  if (!r) { console.log('SKIP (missing):', slug); continue }
  await prisma.blogPost.update({ where: { slug }, data: { seoTitle, metaDescription } })
  n++
  if (seoTitle.length > 60) long.push(`${slug}: title ${seoTitle.length}`)
  if (metaDescription.length > 160) long.push(`${slug}: meta ${metaDescription.length}`)
}
console.log(`\nUpdated ${n} posts.`)
if (long.length) console.log('OVER LIMIT:', long.join(' | ')); else console.log('all titles <=60, metas <=160')
await prisma.$disconnect()
