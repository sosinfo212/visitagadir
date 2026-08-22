import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const SLUG = 'best-spas-hammams-agadir'
const CATEGORY_SLUG = 'travel-guides'

const content = `
<p><strong>Agadir is one of Morocco's best value wellness destinations</strong> — from steamy traditional hammams and affordable neighbourhood massage studios to luxury seafront thalasso spas. Whether you want an authentic Moroccan hammam with black soap and a <em>gommage</em> scrub, a relaxing argan-oil massage, or a full seawater spa day, here's where to go, what it costs, and what to expect in 2026.</p>

<h2>Hammam, spa or thalasso — what's the difference?</h2>
<ul>
  <li><strong>Traditional hammam</strong> — a communal steam bath and deep-cleanse ritual: warm rooms, black (beldi) soap, and an exfoliating scrub with a <em>kessa</em> glove, often finished with rhassoul clay and argan oil. Neighbourhood hammams are cheap and authentic; tourist-facing hammams add private rooms and massages.</li>
  <li><strong>Spa &amp; massage</strong> — modern treatment centres offering argan-oil massages, facials and packages, usually by appointment.</li>
  <li><strong>Thalassotherapy (thalasso)</strong> — heated-seawater pools, jets and marine treatments, found in Agadir's beachfront resort spas. The city's Atlantic setting makes it a natural thalasso destination.</li>
</ul>

<h2>Best hammams in Agadir</h2>
<p>For the authentic ritual, these hammam and hammam-massage spots are a good starting point:</p>
<ul>
  <li><a href="/listing/hammam-oasis">Hammam Oasis</a></li>
  <li><a href="/listing/the-art-of-beauty-hammam-massage">The Art of Beauty — Hammam &amp; Massage</a></li>
  <li><a href="/listing/agadir-spa-hammam-and-massage">Agadir Spa, Hammam and Massage</a></li>
</ul>
<p><strong>Tip:</strong> a simple entry to a neighbourhood hammam typically costs only around 50–150 MAD, while a tourist hammam-plus-scrub-and-massage package usually runs 200–600 MAD depending on treatments.</p>

<h2>Best spas &amp; massage in Agadir</h2>
<p>For modern spas, argan-oil massage and relaxation packages:</p>
<ul>
  <li><a href="/listing/hayat-zen-spa-massage-professionnel-a-agadir">Hayat Zen — Spa &amp; Massage</a></li>
  <li><a href="/listing/california-spa">California Spa</a></li>
  <li><a href="/listing/ste-founty-spa">Ste Founty Spa</a></li>
  <li><a href="/listing/argan-palace-massage-agadir">Argan Palace — Massage Agadir</a></li>
  <li><a href="/listing/natea-les-massages-d-agadir">NATEA — Les Massages d'Agadir</a></li>
  <li><a href="/listing/spa-argan-sens">Spa Argan &amp; Sens</a>, <a href="/listing/itrane-spa">Itrane Spa</a>, <a href="/listing/amarok-spa-massage">Amarok Spa &amp; Massage</a></li>
</ul>
<p>Prices vary by treatment; a one-hour massage commonly sits in the 250–500 MAD range. Check each spa's <a href="/category/health-wellness">wellness listing</a> for current menus and to book.</p>

<h2>Luxury &amp; hotel thalasso spas</h2>
<p>Agadir's resort spas offer heated-seawater pools and high-end treatments — worth booking a day pass even if you're not staying there:</p>
<ul>
  <li><a href="/listing/sofitel-agadir-thalassa-sea-spa">Sofitel Agadir Thalassa Sea &amp; Spa</a> — the city's flagship thalasso.</li>
  <li><a href="/listing/hotel-timoulay-spa-agadir">Hôtel Timoulay &amp; Spa Agadir</a></li>
  <li><a href="/listing/riad-villa-blanche-boutique-hotel-spa">Riad Villa Blanche — Boutique Hotel &amp; Spa</a></li>
  <li><a href="/listing/borjs-hotel-suites-spa">Borjs Hotel Suites &amp; Spa</a>, <a href="/listing/prestige-agadir-h-tel-spa-mqu0mrz1">Prestige Agadir Hôtel &amp; Spa</a></li>
</ul>
<p>Just up the coast, Taghazout and Tamraght also have well-regarded spots such as <a href="/listing/taghazout-golden-spa">Taghazout Golden Spa</a> and <a href="/listing/tazerzit-spa-tamraght">Tazerzit Spa Tamraght</a> if you're basing yourself in surf country.</p>

<h2>What to expect &amp; what to bring</h2>
<ul>
  <li><strong>Bring:</strong> a swimsuit (or go traditional with underwear only in a hammam), flip-flops, and a change of underwear. Towels are usually provided at spas; at a basic local hammam bring your own towel and a plastic mat.</li>
  <li><strong>The scrub is vigorous</strong> — that's normal; the <em>kessa</em> glove removes a surprising amount of dead skin. Say if you'd like it gentler.</li>
  <li><strong>Etiquette:</strong> local hammams have separate hours or areas for men and women; tourist spas offer private rooms and mixed treatments.</li>
  <li><strong>Tipping</strong> a few dirhams for your attendant/masseuse is customary.</li>
  <li><strong>Booking:</strong> walk-ins are fine at neighbourhood hammams; reserve ahead for hotel spas and popular massage studios, especially in high season.</li>
</ul>

<h2>Book a spa or hammam in Agadir</h2>
<p>Browse the full, up-to-date list of wellness venues — hammams, spas, massage and beauty — in the <a href="/category/health-wellness">Agadir health &amp; wellness directory</a> and contact venues directly for prices and availability. Pair a spa afternoon with dinner nearby using our <a href="/blog/best-agadir-marina-restaurants-to-try">Agadir Marina restaurants guide</a>, or plan the rest of your trip with our <a href="/blog/things-to-do-in-agadir">things to do in Agadir</a> guide.</p>
`.trim()

const cat = await prisma.blogCategory.findUnique({ where: { slug: CATEGORY_SLUG } })
if (!cat) { console.log('no category'); process.exit(1) }
const existing = await prisma.blogPost.findUnique({ where: { slug: SLUG } })
if (existing) { console.log('exists already'); process.exit(0) }

const post = await prisma.blogPost.create({
  data: {
    title: 'Best Spas & Hammams in Agadir — Hammam, Massage & Thalasso (2026)',
    slug: SLUG,
    excerpt: 'The best spas, hammams and massage in Agadir — traditional hammams, modern spas and luxury hotel thalasso. Prices, what to expect, and where to book.',
    content,
    authorName: 'Agadir Directory',
    status: 'published',
    publishedAt: new Date(),
    categoryId: cat.id,
    primaryKeywords: 'agadir spa, agadir hammam, agadir massage, spa agadir, hammam agadir, thalasso agadir',
    seoTitle: 'Best Spas & Hammams in Agadir: Hammam, Massage & Thalasso',
    metaDescription: 'The best spas, hammams and massage in Agadir — traditional hammams, modern spas and luxury hotel thalasso. Prices, what to expect, and where to book.',
  },
})
console.log('PUBLISHED:', post.slug, '| cat:', cat.name, '| seoTitle len:', post.seoTitle.length, '| meta len:', post.metaDescription.length, '| content chars:', content.length)
await prisma.$disconnect()
