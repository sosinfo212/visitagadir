/**
 * CTR retitle batch — "Bucket B" local listings.
 *
 * GSC 30d: these rank page 1 for real local Agadir queries but earn <1% CTR
 * (naya club 1,644i @0.18%, cote plage 852i @0.23%, white club 755i @0.13%,
 * avis sur spagos 684i @0%, sahara mall, tiger club, papagayo prix). The
 * audience searches in French — "avis sur X", "X prix", "menu" — so titles
 * lead with those hooks (same playbook that recovered Saffron). seoTitle
 * overrides the generated title; metaDescription is >50 chars so it wins over
 * the thin-content fallback.
 *
 * Run on the server:  node scripts/retitle-bucketb-listings.mjs   (idempotent)
 * Then rebuild (bash scripts/safe-deploy.sh) to clear the ISR cache.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const EDITS = {
  'naya-club-agadir': {
    seoTitle: 'Naya Club Agadir — Avis, Prix, Photos & Contact',
    metaDescription:
      "Naya Club Agadir : avis clients, prix d'entrée, photos, adresse et horaires. Toutes les infos pratiques sur cette boîte de nuit à Agadir.",
  },
  'restaurant-c-t-plage-mqmk7mke': {
    seoTitle: 'Restaurant Côté Plage Agadir — Menu, Avis & Réservation',
    metaDescription:
      "Restaurant Côté Plage à Agadir : menu, avis, photos et réservation. Cuisine en bord de mer sur le front de mer d'Agadir.",
  },
  'white-club': {
    seoTitle: 'White Club Agadir — Avis, Prix, Photos & Contact',
    metaDescription:
      "White Club Agadir : avis, prix d'entrée, photos et adresse. Découvrez cette boîte de nuit incontournable d'Agadir.",
  },
  'spagos-pool-bar': {
    seoTitle: 'Spagos Pool Bar Agadir — Avis, Prix & Photos',
    metaDescription:
      'Spagos Pool Bar à Agadir : avis, prix, photos et infos pratiques. Pool bar, ambiance et détente à Agadir.',
  },
  'sahara-mall-inezgane': {
    seoTitle: 'Sahara Mall Inezgane — Magasins, Horaires & Infos',
    metaDescription:
      "Sahara Mall à Inezgane (Agadir) : liste des magasins, horaires d'ouverture, adresse et infos pratiques du centre commercial.",
  },
  'tiger-club-agadir': {
    seoTitle: 'Tiger Club Agadir — Avis, Prix, Photos & Contact',
    metaDescription:
      'Tiger Club Agadir : avis, prix, photos et adresse. Infos pratiques et horaires de cette boîte de nuit à Agadir.',
  },
  'papagayo-nightclub': {
    seoTitle: 'Papagayo Agadir — Avis, Prix, Photos & Contact',
    metaDescription:
      "Papagayo Nightclub Agadir : avis, prix d'entrée, photos et adresse. Tout savoir sur cette boîte de nuit à Agadir.",
  },
}

async function main() {
  let ok = 0, skip = 0
  for (const [slug, data] of Object.entries(EDITS)) {
    const row = await db.listing.findUnique({ where: { slug }, select: { published: true, name: true } })
    if (!row) { console.log(`SKIP (not found): ${slug}`); skip++; continue }
    await db.listing.update({ where: { slug }, data })
    console.log(`OK  ${slug}  →  "${data.seoTitle}"`)
    ok++
  }
  console.log(`\nDone: ${ok} updated, ${skip} skipped. Rebuild to publish: bash scripts/safe-deploy.sh`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
