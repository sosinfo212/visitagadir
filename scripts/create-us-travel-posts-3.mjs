/**
 * US cluster, batch 3 — closes the day-trip / planning long-tail (DataForSEO US):
 *   7. Best day trips from Agadir  (pillar: paradise valley 390, legzira 390,
 *      taroudant 390, agadir→marrakech 210, souss-massa 210, essaouira — ~1,500 combined)
 *   8. Is Agadir worth visiting & is it safe? (worth 30 + safe 70 + reassurance intent)
 * Accurate to established facts; distances approximate + hedged; no fabrication.
 * Cross-linked to earlier batches + listings/categories. Idempotent upsert.
 */
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const CATEGORY_ID = 'cmqe2h5vp0000t8tay75iimnd' // Travel Guides
const AUTHOR = 'Visit Agadir Editorial Team'

const POSTS = [
  {
    slug: 'best-day-trips-from-agadir',
    title: 'Best Day Trips from Agadir: Paradise Valley, Legzira & More (2026)',
    seoTitle: 'Best Day Trips from Agadir, Morocco (2026): Where to Go',
    metaDescription: 'The best day trips from Agadir: Paradise Valley, Legzira Beach, Taroudant, Souss-Massa park, Essaouira and Marrakech — distances, what to see and how to go.',
    primaryKeywords: 'day trips from agadir, paradise valley agadir, legzira beach, taroudant, agadir to marrakech',
    excerpt: 'Agadir is a great base for day trips — Paradise Valley’s rock pools, the red arches of Legzira, walled Taroudant, Souss-Massa park, Essaouira and Marrakech.',
    content: `
<p>Agadir’s beaches are only half the story — it’s also one of the best bases in southern Morocco for <strong>day trips</strong>. From palm-fringed rock pools in the mountains to red sandstone arches on the coast and walled desert towns, here are the best trips out of Agadir, with rough distances and how to do each one. A rental car gives you the most freedom — see <a href="/category/transport-car-rental">car rental in Agadir</a> and our <a href="/blog/car-rental-agadir-guide">car rental guide</a> — otherwise organised excursions and grand taxis cover the popular routes.</p>

<h2>Paradise Valley</h2>
<p>A palm-lined gorge in the foothills of the High Atlas, <strong>Paradise Valley</strong> is famous for its natural rock pools and swimming spots, reached via the scenic Imouzzer road. It’s roughly an hour’s drive inland from Agadir and makes an easy half- or full-day escape — bring shoes you can walk and swim in. Best in spring and after rain, when the pools are fullest.</p>

<h2>Legzira Beach</h2>
<p><strong>Legzira</strong>, south of Agadir near Sidi Ifni, is one of Morocco’s most photographed beaches for its dramatic red sandstone rock arches over the sand. (One of the famous arches collapsed in 2016, but the setting remains striking.) It’s a longer trip — a few hours each way — so it suits a full day or an overnight further south.</p>

<h2>Taroudant</h2>
<p>Often called “Little Marrakech,” <strong>Taroudant</strong> is a walled town about 1.5 hours east of Agadir, ringed by well-preserved ochre ramparts and home to lively souks with a fraction of Marrakech’s crowds. A great taste of an authentic Moroccan medina close to the coast.</p>

<h2>Souss-Massa National Park</h2>
<p>Just south of Agadir, <strong>Souss-Massa National Park</strong> protects coastal wetlands and is a birdwatching highlight — including the rare bald ibis. Easy to combine with a coastal drive. See our <a href="/blog/souss-massa-park-a-natural-wonder-managed-by-anef">Souss-Massa park guide</a>.</p>

<h2>Essaouira</h2>
<p>The breezy, blue-and-white coastal town of <strong>Essaouira</strong> lies up the Atlantic coast — around three hours north — with a UNESCO-listed medina, ramparts, a working fishing port and a laid-back arts scene. Long as a day trip, but very doable, and you’ll pass argan country on the way (see our <a href="/blog/argan-oil-agadir-morocco">argan oil guide</a>).</p>

<h2>Marrakech</h2>
<p>The imperial city of <strong>Marrakech</strong> is roughly a three-hour drive from Agadir via the expressway. It’s a big day out — souks, Jemaa el-Fnaa, palaces and gardens — so leave early, or better, stay a night. Grand taxis, buses and organised tours all run the route.</p>

<h2>Closer to town</h2>
<p>Short on time? Head up the coast to <a href="/blog/taghazout-surf-town-guide">Taghazout</a> for surf and seafood, or explore Agadir itself — see <a href="/blog/10-most-things-to-do-in-agadir-morocco">things to do in Agadir</a> and the city’s <a href="/blog/beaches-in-agadir-guide">beaches</a>.</p>

<h2>Planning tips</h2>
<ul>
<li><strong>Get there:</strong> a rental car is ideal for Paradise Valley, Legzira and Taroudant; tours/taxis are easiest for Marrakech and Essaouira. See <a href="/blog/getting-to-agadir-airport-flights">getting to Agadir</a>.</li>
<li><strong>Best season:</strong> spring and autumn are ideal — check our <a href="/blog/agadir-weather-best-time-to-visit">weather &amp; best time to visit</a> guide.</li>
<li><strong>Start early</strong> for the longer trips (Marrakech, Essaouira, Legzira) and carry water, sun protection and cash for smaller towns.</li>
</ul>
`.trim(),
  },
  {
    slug: 'is-agadir-worth-visiting-safe',
    title: 'Is Agadir Worth Visiting? (And Is It Safe?) — 2026 Honest Guide',
    seoTitle: 'Is Agadir Worth Visiting & Is It Safe? Honest 2026 Guide',
    metaDescription: 'Is Agadir worth visiting, and is it safe? An honest look at who Agadir suits, what to expect, and practical safety tips for travelers to this Moroccan resort city.',
    primaryKeywords: 'is agadir worth visiting, is agadir safe, agadir morocco travel',
    excerpt: 'An honest take on whether Agadir is worth visiting, who it suits, and how safe it is — plus practical tips for a smooth trip.',
    content: `
<p>Thinking about a trip and wondering <strong>“is Agadir worth visiting?”</strong> — and <strong>“is Agadir safe?”</strong> Here’s an honest answer to both.</p>

<h2>Is Agadir worth visiting?</h2>
<p>It depends what you want. Agadir is Morocco’s premier <strong>beach-and-sun resort city</strong>: a long golden bay, reliable sunshine most of the year, relaxed beach clubs, good seafood, and an easy, modern feel. Rebuilt after the 1960 earthquake, it doesn’t have the ancient medina of Marrakech or Fes — so if your dream is labyrinthine old-city culture, Agadir alone won’t deliver it.</p>
<p><strong>Agadir is worth it if you want:</strong></p>
<ul>
<li>A relaxed beach holiday with lots of sun (great in winter too).</li>
<li>Surfing and a laid-back coast — <a href="/blog/taghazout-surf-town-guide">Taghazout</a> is right up the road.</li>
<li>A comfortable base for <a href="/blog/best-day-trips-from-agadir">day trips</a> (Paradise Valley, Taroudant, Essaouira, even Marrakech).</li>
</ul>
<p><strong>Pair it with Marrakech or Essaouira</strong> if you also want historic-city culture. Many travelers combine a few beach days in Agadir with a cultural stop elsewhere.</p>

<h2>Is Agadir safe?</h2>
<p>Agadir is generally considered <strong>safe for tourists</strong>. Morocco is a well-established destination and Agadir in particular is a purpose-built resort city used to international visitors, with low levels of violent crime. As anywhere, the main things to watch are <strong>petty theft and tourist-targeted scams</strong>, not danger.</p>
<p>Practical tips:</p>
<ul>
<li>Keep valuables secure in crowded markets and on the beach; use hotel safes.</li>
<li>Agree taxi fares or insist on the meter before you set off.</li>
<li>Be politely firm with persistent vendors or unofficial “guides.”</li>
<li>Dress modestly away from the beach/resort zone out of respect.</li>
<li>Drink bottled or filtered water; solo and female travelers generally report Agadir as comfortable, with the usual big-city awareness.</li>
</ul>
<p>Always check your own government’s current travel advice before you go.</p>

<h2>The verdict</h2>
<p>If you want sun, beach, surf and an easy base for exploring southern Morocco, <strong>Agadir is well worth visiting and comfortably safe</strong> with normal precautions. Start planning with our <a href="/blog/agadir-weather-best-time-to-visit">best time to visit</a> guide, <a href="/blog/10-most-things-to-do-in-agadir-morocco">things to do</a>, and <a href="/blog/getting-to-agadir-airport-flights">how to get there</a>.</p>
`.trim(),
  },
]

async function main() {
  const cat = await db.blogCategory.findUnique({ where: { id: CATEGORY_ID }, select: { name: true } })
  if (!cat) { console.error('Category not found — aborting.'); process.exit(1) }
  for (const p of POSTS) {
    const data = { ...p, authorName: AUTHOR, status: 'published', publishedAt: new Date(), categoryId: CATEGORY_ID }
    const r = await db.blogPost.upsert({ where: { slug: p.slug }, update: data, create: data, select: { slug: true, status: true } })
    console.log(`OK  /blog/${r.slug}  (${r.status})`)
  }
  console.log('\nDone. Rebuild: bash scripts/safe-deploy.sh')
}
main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
