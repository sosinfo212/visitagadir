/**
 * Import / refresh a listing from curated Google Maps public data.
 * Run: npx tsx scripts/import-google-maps-listing.ts
 */
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { MediaImporter } from '../src/lib/blog/import-media'
import { splitImagesForStorage } from '../src/lib/listing-images'

const db = new PrismaClient()

const LISTING_MEDIA_DIR = path.join('public', 'uploads', 'listings', 'imported')

/** Pure Passion — Marina Agadir (Google place_id: ChIJX_jt3sa2sw0RbXgzMEyHl80) */
const GOOGLE_LISTING = {
  slug: 'pure-passion',
  name: 'Pure Passion',
  description: `<p>Restaurant gastronomique au cœur de la Marina d'Agadir, entre poissons frais, viandes nobles et saveurs méditerranéennes. Terrasse avec vue sur les bateaux, service attentif et carte élaborée (huîtres, poissons grillés, entrecôte, desserts maison).</p>
<p>Ingrédients sélectionnés, ambiance raffinée et cadre idéal pour un déjeuner ou un dîner au bord de l'eau. Réservation recommandée, surtout le week-end.</p>`,
  address: 'Résidence N°02 m1, Complexe Marina, Agadir 80010',
  phone: '+212 528 84 01 20',
  website: 'https://www.purepassion.ma/marina-agadir/',
  email: 'reservation@purepassion.ma',
  city: 'Agadir',
  region: 'Souss-Massa',
  postalCode: '80010',
  country: 'MA',
  latitude: 30.422433,
  longitude: -9.618683,
  priceRange: '$$$$',
  schemaType: 'Restaurant',
  featured: true,
  published: true,
  googleMapsUrl:
    'https://www.google.com/maps/place/?q=place_id:ChIJX_jt3sa2sw0RbXgzMEyHl80',
  /** Aggregate Google rating (displayed alongside imported review sample). */
  googleRating: 4.5,
  googleReviewCount: 1873,
  categorySlug: 'restaurants-cafes',
  openingHours: [
    {
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '12:00',
      closes: '00:00',
    },
  ],
  imageUrls: [
    'https://www.purepassion.ma/wp-content/uploads/2026/05/DSC00089_0004_IMG_0820-scaled.jpg',
    'https://www.purepassion.ma/wp-content/uploads/2025/11/DSC02756-scaled.jpg',
    'https://www.purepassion.ma/wp-content/uploads/2026/05/sunset-pure-passion-768x512.jpg',
    'https://www.purepassion.ma/wp-content/uploads/2026/05/DSC00089_0006_IMG_0689-768x513.jpg',
    'https://www.purepassion.ma/wp-content/uploads/2026/05/DSC00089_0009_DSC00459-768x513.jpg',
    'https://www.purepassion.ma/wp-content/uploads/2026/05/IMG_0727_0001_IMG_0906-768x1152.jpg',
  ],
  logoUrl: 'https://www.purepassion.ma/wp-content/uploads/2025/11/Pure-Passion-LogoS.png',
  /** Sample reviews sourced from Google Maps (via public aggregators). */
  reviews: [
    {
      authorName: 'F H',
      rating: 5,
      comment:
        "I simply loved my experience dining at Pure Passion. From the food to the service to the vibe, everything was excellent! The portions were generous, the food was tasty and I would definitely go back. Cooking seafood is harder than it looks but it was sublime.",
    },
    {
      authorName: 'ISMAIL A',
      rating: 5,
      comment:
        "We had a nice culinary experience at Restaurant Pure Passion in Agadir. The fish dishes and a refreshing mojito were delicious and well-prepared. The view over the sea, boats and marina is very picturesque. Pre-booking is required to get a table.",
    },
    {
      authorName: 'Luke M',
      rating: 4,
      comment:
        "Came here for a special lunch and it was lovely. Fresh bread and dips at the start, gazpacho and mango — a refreshing way to begin. Moroccan beer and white wine were amazing. Oysters and goat cheese salad were great starters.",
    },
    {
      authorName: 'Simon H',
      rating: 5,
      comment:
        'Great food and atmosphere. Plenty to choose from. Fish dishes and steak were very good. Reasonably priced at around £100 per couple for 2 courses and good wine with tip.',
    },
    {
      authorName: 'Amy F',
      rating: 5,
      comment:
        'The food was delicious, and the server was attentive and talkative. The chilled background music was nice. Overall, I had a great experience — a bit on the expensive side for dining out in Morocco.',
    },
    {
      authorName: 'Chris',
      rating: 5,
      comment:
        'Excellent restaurant on the marina. Attentive service, refined decor and a terrace with a beautiful view of the boats. Seafood and meat dishes are both outstanding.',
    },
  ],
}

async function main() {
  const category = await db.category.findUnique({
    where: { slug: GOOGLE_LISTING.categorySlug },
  })
  if (!category) {
    throw new Error(`Category "${GOOGLE_LISTING.categorySlug}" not found. Run seed first.`)
  }

  const importer = new MediaImporter({ uploadSubdir: LISTING_MEDIA_DIR })
  const allRemoteUrls = [...GOOGLE_LISTING.imageUrls, GOOGLE_LISTING.logoUrl]
  await importer.importMany(allRemoteUrls)
  const urlMap = importer.getStats().cache

  const localImages = GOOGLE_LISTING.imageUrls
    .map((u) => urlMap.get(u))
    .filter((u): u is string => Boolean(u))

  if (localImages.length === 0) {
    throw new Error('Failed to download any listing images.')
  }

  const { image, gallery } = splitImagesForStorage(localImages)
  const logo = urlMap.get(GOOGLE_LISTING.logoUrl) ?? null

  const listingData = {
    name: GOOGLE_LISTING.name,
    description: GOOGLE_LISTING.description,
    address: GOOGLE_LISTING.address,
    phone: GOOGLE_LISTING.phone,
    website: GOOGLE_LISTING.website,
    email: GOOGLE_LISTING.email,
    city: GOOGLE_LISTING.city,
    region: GOOGLE_LISTING.region,
    postalCode: GOOGLE_LISTING.postalCode,
    country: GOOGLE_LISTING.country,
    latitude: GOOGLE_LISTING.latitude,
    longitude: GOOGLE_LISTING.longitude,
    priceRange: GOOGLE_LISTING.priceRange,
    schemaType: GOOGLE_LISTING.schemaType,
    featured: GOOGLE_LISTING.featured,
    published: GOOGLE_LISTING.published,
    categoryId: category.id,
    image,
    gallery,
    logo,
    openingHours: JSON.stringify(GOOGLE_LISTING.openingHours),
    canonicalUrl: null, // self-canonical to /listing/<slug>, not the Google Maps URL
    seoTitle: `${GOOGLE_LISTING.name} — Restaurant Marina Agadir`,
    metaDescription:
      'Restaurant gastronomique à la Marina d\'Agadir : poissons frais, viandes, terrasse vue mer. Réservation +212 528 84 01 20.',
    metaKeywords: 'Pure Passion, restaurant Agadir, Marina Agadir, fruits de mer, gastronomie',
    rating: GOOGLE_LISTING.googleRating,
    reviewCount: GOOGLE_LISTING.googleReviewCount,
  }

  let listing = await db.listing.findUnique({ where: { slug: GOOGLE_LISTING.slug } })

  if (listing) {
    listing = await db.listing.update({
      where: { id: listing.id },
      data: listingData,
    })
    console.log(`Updated listing: ${listing.slug} (${listing.id})`)
  } else {
    listing = await db.listing.create({
      data: { slug: GOOGLE_LISTING.slug, ...listingData },
    })
    console.log(`Created listing: ${listing.slug} (${listing.id})`)
  }

  // Replace prior imported Google reviews for this listing
  await db.review.deleteMany({ where: { listingId: listing.id } })

  for (const review of GOOGLE_LISTING.reviews) {
    await db.review.create({
      data: {
        listingId: listing.id,
        authorName: review.authorName,
        rating: review.rating,
        comment: review.comment,
        approved: true,
      },
    })
  }

  // Keep Google Maps aggregate on the listing header; sample reviews are shown below.
  await db.listing.update({
    where: { id: listing.id },
    data: {
      rating: GOOGLE_LISTING.googleRating,
      reviewCount: GOOGLE_LISTING.googleReviewCount,
    },
  })

  // Avoid duplicate seed entry for the same restaurant
  const duplicate = await db.listing.findUnique({
    where: { slug: 'pure-passion-restaurant' },
  })
  if (duplicate) {
    await db.listing.update({
      where: { id: duplicate.id },
      data: { published: false },
    })
    console.log('Unpublished duplicate listing: pure-passion-restaurant')
  }

  const stats = importer.getStats()
  const final = await db.listing.findUnique({
    where: { id: listing.id },
    include: { reviews: { where: { approved: true } } },
  })

  console.log('\nImport complete')
  console.log(`  Images downloaded: ${stats.downloaded} (failed: ${stats.failed})`)
  console.log(`  Gallery images: ${localImages.length}`)
  console.log(`  Approved reviews: ${final?.reviews.length ?? 0}`)
  console.log(`  Listing rating: ${final?.rating} (${final?.reviewCount} on Google Maps aggregate)`)
  console.log(`  URL: /listing/${final?.slug}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
