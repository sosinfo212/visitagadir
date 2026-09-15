/**
 * Push naya-club + cote-plage toward top-3 (GSC: p10.4 / p7, big impressions).
 * Two safe on-page levers (NO fabricated reviews):
 *   1. Fix naya's 73-char placeholder description (thin content suppresses it).
 *   2. Add editorial internal links from topically-relevant blog posts to the
 *      venues (real ranking signal + genuinely useful to readers).
 * Idempotent (markers guard the appends). Rebuild after to clear ISR.
 */
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const NAYA_DESC = `<p><strong>Naya Club</strong> is one of Agadir's nightlife venues, set inside Hotel Royal Mirage on Avenue Mohammed V — in the heart of the city's hotel and beach district, so it's an easy night out for visitors staying near the seafront.</p>
<p>As a central Agadir club, expect the usual late-night mix of music, drinks and a dance-floor atmosphere that builds after dark. Being on Mohammed V makes it simple to reach on foot from many beachfront hotels, and it sits close to other clubs if you want to move between venues.</p>
<p>For current opening nights, entry and prices, use the contact details on this page. You can also browse more <a href="/category/nightlife-entertainment">nightlife venues in Agadir</a> or read our <a href="/blog/agadir-nightlife-where-to-go-after-dark">Agadir nightlife guide</a> to plan the evening.</p>`

const APPENDS = [
  {
    slug: 'agadir-nightlife-where-to-go-after-dark',
    marker: 'Featured Agadir nightspots',
    html: `\n<h2>Featured Agadir nightspots</h2>\n<ul>\n<li><a href="/listing/naya-club-agadir">Naya Club Agadir</a> — club at Hotel Royal Mirage on Avenue Mohammed V.</li>\n<li><a href="/listing/white-club">White Club Agadir</a> — central nightclub in the beach district.</li>\n<li><a href="/listing/tiger-club-agadir">Tiger Club Agadir</a> — late-night spot in Agadir.</li>\n<li><a href="/listing/papagayo-nightclub">Papagayo Agadir</a> — well-known Agadir nightclub.</li>\n</ul>`,
  },
  {
    slug: 'best-rooftop-restaurants-agadir',
    marker: 'restaurant-c-t-plage-mqmk7mke',
    html: `\n<p>Prefer dining right by the water instead of up high? See <a href="/listing/restaurant-c-t-plage-mqmk7mke">Restaurant Côté Plage</a> for beachfront dining on Agadir's Boulevard du 20 Août.</p>`,
  },
]

async function main() {
  // 1. naya description
  const naya = await db.listing.findUnique({ where: { slug: 'naya-club-agadir' }, select: { description: true } })
  if (naya) {
    await db.listing.update({ where: { slug: 'naya-club-agadir' }, data: { description: NAYA_DESC } })
    console.log(`naya-club-agadir: description ${naya.description?.length || 0} → ${NAYA_DESC.length} chars`)
  } else console.log('naya-club-agadir NOT FOUND')

  // 2. internal-link appends (idempotent)
  for (const a of APPENDS) {
    const post = await db.blogPost.findUnique({ where: { slug: a.slug }, select: { content: true } })
    if (!post) { console.log(`SKIP (post not found): ${a.slug}`); continue }
    if (post.content.includes(a.marker)) { console.log(`SKIP (already linked): ${a.slug}`); continue }
    await db.blogPost.update({ where: { slug: a.slug }, data: { content: post.content + a.html } })
    console.log(`Appended internal links to: ${a.slug}`)
  }
  console.log('\nDone. Rebuild: bash scripts/safe-deploy.sh')
}
main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
