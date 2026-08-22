/**
 * Create the B1 quick-win post: "Car Rental in Agadir" (draft).
 * High commercial intent; site already ranks p2 for "agadir car rental".
 * Created as status:draft — review, then publish.
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const SLUG = 'car-rental-agadir-guide'
const CATEGORY_SLUG = 'travel-guides'

const content = `
<p><strong>Renting a car is the easiest way to explore Agadir and the Souss-Massa coast</strong> — from Taghazout's surf beaches to Paradise Valley and Souss-Massa National Park. You can pick up a car right at Al Massira Airport (AGA) or from a city-centre agency, with economy models typically starting from around €20–30 per day outside peak summer. Below is a practical 2026 guide to <em>location de voiture à Agadir</em>: where to rent, what it costs, how "no-deposit" (<em>sans caution</em>) rentals work, and what to check before you book.</p>

<h2>Where to rent a car in Agadir</h2>
<p>You have two main options, and the right one depends on your arrival plans:</p>
<ul>
  <li><strong>Al Massira Airport (AGA)</strong> — about 25&nbsp;km (25–35 minutes) east of the city. Renting at the airport means you drive off the moment you land, which is ideal if you're heading straight to Taghazout, Tamraght or a day trip. Airport counters can cost a little more, so compare against city agencies.</li>
  <li><strong>Agadir city centre &amp; Marina</strong> — dozens of independent agencies cluster around the city and the seafront. City pickups are often cheaper and more flexible on deposits, and many will deliver the car to your hotel or the airport for a small fee.</li>
</ul>
<p>Browse and compare local companies in the <a href="/category/transport-car-rental">Agadir car rental directory</a>, or see specific agencies such as <a href="/listing/volcars-location-voiture-agadir-car-rental-agadir">Volcars</a>, <a href="/listing/aldo-cars-location-de-voiture-agadir">Aldo Cars</a> and <a href="/listing/r7-cars-rseven-cars-location-voiture-agadir">R7 Cars</a>.</p>

<h2>How much does car rental in Agadir cost in 2026?</h2>
<p>Prices swing with the season — July, August and the Christmas/New Year period are the most expensive, while spring and autumn are cheapest. As a rough guide, expect:</p>
<ul>
  <li><strong>Economy / small hatchback</strong> (Dacia Sandero, Hyundai i10): typically from around €20–30 / 220–330 MAD per day.</li>
  <li><strong>Compact &amp; SUV</strong> (Dacia Duster, Hyundai Tucson): usually €35–60 / 380–650 MAD per day.</li>
  <li><strong>Longer rentals</strong> (7+ days) almost always get a lower daily rate — always ask for a weekly price.</li>
</ul>
<p>These are indicative ranges; for live quotes, check the individual agencies in our <a href="/category/transport-car-rental">car rental listings</a>, as many run seasonal offers.</p>

<h2>No-deposit &amp; "sans caution" car rental</h2>
<p>One of the most-searched terms locally is <em>location voiture Agadir sans caution</em> — car rental with no security deposit. Big international brands usually block a large deposit on your credit card; many Agadir agencies instead offer <strong>sans caution / no-deposit</strong> rentals, which is why they're so popular with visitors.</p>
<p>If a low or zero deposit matters to you, look at specialists such as <a href="/listing/drive-plus-cheap-car-rental-agadir-airport-without-deposit-location-voiture-agadir-aeroport-pas-cher-sans-caution">Drive Plus (airport, no deposit)</a>, <a href="/listing/ayamed-cars-location-voiture-agadir-aeroport-pas-cher-sans-caution-cheap-car-rental-agadir-airport-whithout-deposit">Ayamed Cars</a> and <a href="/listing/avantage-cars-location-voiture-agadir-location-voiture-agadir-aeroport-sans-caution-car-rental-agadir">Avantage Cars</a>. Just confirm what "no deposit" covers — see insurance below.</p>

<h2>What to check before you book</h2>
<p>A cheap headline price can hide costs. Before you confirm, check:</p>
<ul>
  <li><strong>Insurance &amp; excess</strong> — "sans caution" usually means the agency won't hold a deposit, but you may still be liable for damage up to an excess amount. Ask what's covered (CDW, theft) and whether you can reduce the excess.</li>
  <li><strong>Fuel policy</strong> — "full-to-full" is fairest; avoid "full-to-empty" where you pre-pay for fuel.</li>
  <li><strong>Mileage</strong> — most local rentals are unlimited, but confirm if you plan a long trip (e.g. Marrakech or the Sahara).</li>
  <li><strong>Documents</strong> — you'll need your passport, driving licence (an International Driving Permit is recommended), and a credit or debit card. Minimum age is usually 21.</li>
  <li><strong>Delivery &amp; drop-off</strong> — ask about free airport or hotel delivery and one-way returns.</li>
</ul>

<h2>Do you actually need a car in Agadir?</h2>
<p>Within the city, taxis and buses are cheap and easy — see our guide to <a href="/blog/how-to-get-around-agadir">getting around Agadir</a>. A rental car earns its keep when you want to explore beyond the city on your own schedule: the surf villages of <a href="/listing">Taghazout and Tamraght</a>, Paradise Valley, Souss-Massa National Park, or day trips to Taroudant, Tiznit and Essaouira. Morocco drives on the right; roads to the main sights are good, and parking in Agadir is generally easy and inexpensive.</p>
<p>Arriving by air and not renting? Compare your options in our <a href="/blog/agadir-airport-transfer-options">Agadir airport transfer guide</a>.</p>

<h2>Best car rental agencies in Agadir</h2>
<p>The Agadir Directory lists local, independent car-rental companies — many offering airport pickup and no-deposit deals. A few to start with:</p>
<ul>
  <li><a href="/listing/drive-plus-cheap-car-rental-agadir-airport-without-deposit-location-voiture-agadir-aeroport-pas-cher-sans-caution">Drive Plus</a> — cheap airport rental, no deposit.</li>
  <li><a href="/listing/volcars-location-voiture-agadir-car-rental-agadir">Volcars</a> — location voiture Agadir.</li>
  <li><a href="/listing/aldo-cars-location-de-voiture-agadir">Aldo Cars</a></li>
  <li><a href="/listing/akhiyat-driver-cars-location-de-voiture-agadir-rent-car-agadir-airport">Akhiyat Driver Cars</a> — airport rentals.</li>
  <li><a href="/listing/self-cars">Self Cars</a>, <a href="/listing/cars-2-rent">Cars 2 Rent</a>, <a href="/listing/odelta-rent-car">ODelta Rent Car</a></li>
</ul>
<p>See the full, up-to-date list in the <a href="/category/transport-car-rental">Agadir car rental category</a> and contact agencies directly for current prices and availability.</p>
`.trim()

const cat = await prisma.blogCategory.findUnique({ where: { slug: CATEGORY_SLUG } })
if (!cat) { console.log('category not found:', CATEGORY_SLUG); process.exit(1) }

const existing = await prisma.blogPost.findUnique({ where: { slug: SLUG } })
if (existing) { console.log('post already exists:', SLUG); process.exit(0) }

const post = await prisma.blogPost.create({
  data: {
    title: 'Car Rental in Agadir — Airport, Prices & No-Deposit Guide (2026)',
    slug: SLUG,
    excerpt: 'How to rent a car in Agadir — airport vs city agencies, 2026 prices, no-deposit (sans caution) options, insurance tips, and the best local companies.',
    content,
    authorName: 'Agadir Directory',
    status: 'draft',
    categoryId: cat.id,
    primaryKeywords: 'car rental agadir, location voiture agadir, agadir airport car rental, location voiture agadir sans caution',
    seoTitle: 'Car Rental in Agadir: Airport, Prices & No-Deposit Tips',
    metaDescription: 'How to rent a car in Agadir — airport vs city agencies, 2026 daily rates, no-deposit (sans caution) options, insurance tips, and the best local car-rental companies.',
  },
})
console.log('Created DRAFT post:', post.slug, '| id:', post.id, '| category:', cat.name)
console.log('seoTitle len:', post.seoTitle.length, '| meta len:', post.metaDescription.length, '| content chars:', content.length)
await prisma.$disconnect()
