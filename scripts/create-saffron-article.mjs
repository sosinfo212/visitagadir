/**
 * Supporting article for the Saffron Restaurant keyword cluster.
 *
 * The listing /listing/saffron-restaurant-mqmy5005 already ranks p3.7 for
 * "saffron agadir" / "saffron restaurant agadir menu" and should stay the
 * primary (navigational/commercial) page. This post is a SUPPORTING,
 * informational asset ("menu guide / what to order") that funnels authority to
 * the listing via an exact-match internal link — it must NOT out-compete the
 * listing for the navigational query. Restore/republish the listing first.
 *
 * Facts are from the listing (Indian/Pakistani/Desi, beachfront Promenade
 * Tawada, Agadir). No prices/specific dishes are fabricated — readers are sent
 * to the listing for the live menu.
 *
 * Run on the server:  node scripts/create-saffron-article.mjs
 * Idempotent (upsert by slug). Rebuild after (bash scripts/safe-deploy.sh) or
 * publish via admin so the ISR cache picks it up.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const SLUG = 'saffron-restaurant-agadir-menu-guide'
const CATEGORY_ID = 'cmqe2h5vy0002t8taakj2d4zk' // Food & Dining
const LISTING = '/listing/saffron-restaurant-mqmy5005'
const CATEGORY = '/category/restaurants-cafes'

const content = `
<p><strong>Saffron Restaurant</strong> is one of the few places in Agadir serving authentic Indian, Pakistani and Desi cuisine, right on the beachfront along Promenade Tawada. If you have been searching for the <em>Saffron restaurant Agadir menu</em> — what they cook, what to order, and whether it is worth the trip — this guide covers it, and points you to the live details. For opening hours, photos, current dishes and to leave a review, see the full <a href="${LISTING}">Saffron Restaurant</a> listing.</p>

<h2>Quick verdict: is Saffron worth it?</h2>
<p>If you are craving proper South Asian food — rich curries, tandoori, biryani and fresh naan — Saffron is one of the clearest options in Agadir. It combines home-style South Asian cooking with an elegant, welcoming setting and an oceanfront location that few restaurants in the city can match. Early diner reviews are very positive (a 5-star average, from a small but growing number of reviews), which is worth knowing if you like to be an early discoverer rather than following the crowds.</p>

<h2>Where is Saffron Restaurant in Agadir?</h2>
<p>Saffron sits on the <strong>Beach Front along Promenade Tawada, Agadir 80000</strong> — the palm-lined seaside promenade that runs the length of Agadir Bay. That location makes it easy to combine a meal with a walk by the ocean, and simple to reach whether you are staying in the hotel district or coming from the marina end of the beach.</p>
<p>Because it is directly on the promenade, it is a natural stop for visitors already exploring Agadir's seafront rather than a place you need to go out of your way for. Exact directions, the map pin and contact details are on the <a href="${LISTING}">Saffron Restaurant listing</a>.</p>

<h2>What kind of food does Saffron serve?</h2>
<p>Saffron specialises in <strong>Indian, Pakistani and traditional Desi cuisine</strong> — the food cultures of the Indian subcontinent. If "Desi" is new to you, it simply refers to the home-style cooking of India, Pakistan and the wider region: layered spice blends, slow-cooked gravies, charcoal-grilled meats and freshly baked breads. It is a genuinely different experience from the Moroccan tagines and grills you will find elsewhere in Agadir, which is exactly why it stands out.</p>
<p>This style of kitchen is a welcome change of pace for travellers who have been eating Moroccan food all week, and a taste of home for the South Asian community and visitors in the area.</p>

<h2>Saffron Restaurant Agadir menu: what to order</h2>
<p>Menus at South Asian restaurants like Saffron are usually organised into a few clear sections. Here is what to look for and how to build a good order — check the <a href="${LISTING}">Saffron Restaurant listing</a> for the current menu and prices, which the restaurant keeps up to date.</p>
<ul>
  <li><strong>Starters &amp; tandoori:</strong> charcoal-grilled items such as tikka and seekh kebabs are the classic way to begin, and a good test of any Desi kitchen.</li>
  <li><strong>Curries:</strong> the heart of the menu — expect rich, spiced gravies ranging from mild and creamy to bold and fiery. If you are unsure of the heat, ask the staff to guide you.</li>
  <li><strong>Biryani &amp; rice:</strong> fragrant, layered rice dishes are a signature of Pakistani and Indian cooking and make a satisfying single-plate meal.</li>
  <li><strong>Breads:</strong> freshly baked naan and roti are essential for scooping up curry — order a couple to share.</li>
  <li><strong>Vegetarian options:</strong> South Asian cuisine is one of the most vegetarian-friendly in the world, so plant-based diners are usually well looked after.</li>
</ul>
<p>A simple, crowd-pleasing order for two: one tandoori starter to share, two contrasting curries (one mild, one spicier), a biryani, and a couple of breads. Tell your server your spice tolerance and any dietary needs when you order.</p>

<h3>Dietary notes</h3>
<p>If halal, vegetarian or allergen information matters to you, confirm directly with the restaurant — contact details are on the <a href="${LISTING}">listing</a>. South Asian menus generally offer plenty of vegetarian and vegan-adaptable dishes, but it is always worth asking about specific preparations.</p>

<h2>The setting: beachfront dining on Promenade Tawada</h2>
<p>Part of Saffron's appeal is simply where it is. Dining on the Promenade Tawada beachfront means sea air, a relaxed pace and an easy pre- or post-dinner stroll along the water. It suits a special evening out, a family dinner, or a change of scene from hotel restaurants — an elegant, contemporary space paired with traditional South Asian hospitality.</p>

<h2>Tips for visiting Saffron</h2>
<ul>
  <li><strong>Go at golden hour</strong> if you can — the beachfront setting is at its best around sunset.</li>
  <li><strong>Share dishes.</strong> Desi food is made for the table; ordering a spread lets everyone try more.</li>
  <li><strong>Check current hours and book ahead</strong> for larger groups or peak evenings via the <a href="${LISTING}">listing</a>.</li>
  <li><strong>Leave a review</strong> after your meal — the restaurant is newer to the guide, and honest reviews help other diners.</li>
</ul>

<h2>More places to eat in Agadir</h2>
<p>Saffron is one option in a growing dining scene. If you want to compare it with other spots — Moroccan, seafood, rooftop and international — browse all <a href="${CATEGORY}">restaurants and cafés in Agadir</a> to plan the rest of your trip.</p>

<h2>The bottom line</h2>
<p>For authentic Indian, Pakistani and Desi food with a beachfront setting, Saffron Restaurant is a distinctive choice in Agadir. Use this guide to know what to expect, then head to the <a href="${LISTING}">Saffron Restaurant listing</a> for the live menu, opening hours, location and reviews before you go.</p>
`.trim()

const data = {
  title: 'Saffron Restaurant Agadir: Menu Guide & What to Order (2026)',
  slug: SLUG,
  excerpt:
    'A guide to Saffron Restaurant in Agadir — authentic Indian, Pakistani and Desi cuisine on the Promenade Tawada beachfront. What to order, dietary notes, and where to find the live menu.',
  content,
  authorName: 'Visit Agadir Editorial Team',
  status: 'published',
  publishedAt: new Date(),
  categoryId: CATEGORY_ID,
  primaryKeywords: 'saffron agadir, saffron restaurant agadir menu, indian restaurant agadir, desi food agadir',
  seoTitle: 'Saffron Restaurant Agadir: Menu Guide & What to Order (2026)',
  metaDescription:
    'Saffron Restaurant Agadir serves authentic Indian, Pakistani & Desi cuisine on the beachfront. See what to order, dietary notes, and the live menu & hours.',
}

async function main() {
  const cat = await db.blogCategory.findUnique({ where: { id: CATEGORY_ID }, select: { name: true } })
  if (!cat) { console.error('Category id not found — aborting.'); process.exit(1) }
  const post = await db.blogPost.upsert({
    where: { slug: SLUG },
    update: { ...data },
    create: { ...data },
    select: { id: true, slug: true, status: true, title: true },
  })
  console.log('Upserted post:', post)
  console.log(`Live at: /blog/${SLUG} — rebuild (bash scripts/safe-deploy.sh) or publish via admin to clear ISR.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
