import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'

const categories = [
  {
    name: 'Restaurants & Cafés',
    slug: 'restaurants-cafes',
    icon: 'UtensilsCrossed',
    description: 'Discover the best restaurants and cafés in Agadir. From traditional Moroccan cuisine to international flavors, find your perfect dining experience.',
  },
  {
    name: 'Hotels & Accommodation',
    slug: 'hotels-accommodation',
    icon: 'Hotel',
    description: 'Find the perfect place to stay in Agadir. Luxury resorts, cozy guesthouses, and budget-friendly options along the beautiful coastline.',
  },
  {
    name: 'Beaches & Water Sports',
    slug: 'beaches-water-sports',
    icon: 'Waves',
    description: 'Explore Agadir\'s stunning beaches and exciting water sports. Surfing, jet skiing, boat tours, and relaxing beach clubs await you.',
  },
  {
    name: 'Shopping & Markets',
    slug: 'shopping-markets',
    icon: 'ShoppingBag',
    description: 'Shop at Agadir\'s vibrant markets and modern malls. From traditional souks to luxury boutiques, find everything you need.',
  },
  {
    name: 'Health & Wellness',
    slug: 'health-wellness',
    icon: 'Heart',
    description: 'Find healthcare providers, spas, and wellness centers in Agadir. From hospitals to hammams, your health and wellbeing are covered.',
  },
  {
    name: 'Education & Training',
    slug: 'education-training',
    icon: 'GraduationCap',
    description: 'Discover schools, universities, language centers, and professional training institutes in Agadir.',
  },
  {
    name: 'Transport & Car Rental',
    slug: 'transport-car-rental',
    icon: 'Car',
    description: 'Get around Agadir with ease. Car rentals, taxis, bus services, and airport transfers all in one place.',
  },
  {
    name: 'Professional Services',
    slug: 'professional-services',
    icon: 'Briefcase',
    description: 'Find lawyers, accountants, real estate agents, and other professional services in Agadir.',
  },
  {
    name: 'Nightlife & Entertainment',
    slug: 'nightlife-entertainment',
    icon: 'Music',
    description: 'Experience Agadir after dark. Bars, clubs, casinos, and live entertainment venues for unforgettable nights.',
  },
  {
    name: 'Tours & Excursions',
    slug: 'tours-excursions',
    icon: 'Compass',
    description: 'Book unforgettable tours and excursions from Agadir. Desert safaris, mountain trips, and coastal adventures.',
  },
  {
    name: 'Home Services',
    slug: 'home-services',
    icon: 'Home',
    description: 'Find plumbers, electricians, cleaning services, and other home service providers in Agadir.',
  },
  {
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    icon: 'Sparkles',
    description: 'Discover hair salons, barbershops, nail studios, and beauty centers in Agadir.',
  },
]

// Map category slugs to their images
const categoryImages: Record<string, string> = {
  'restaurants-cafes': '/listings/restaurants-cafes.jpg',
  'hotels-accommodation': '/listings/hotels-accommodation.jpg',
  'beaches-water-sports': '/listings/beaches-water-sports.jpg',
  'shopping-markets': '/listings/shopping-markets.jpg',
  'health-wellness': '/listings/health-wellness.jpg',
  'education-training': '/listings/education-training.jpg',
  'transport-car-rental': '/listings/transport-car-rental.jpg',
  'professional-services': '/listings/professional-services.jpg',
  'nightlife-entertainment': '/listings/nightlife-entertainment.jpg',
  'tours-excursions': '/listings/tours-excursions.jpg',
  'home-services': '/listings/home-services.jpg',
  'beauty-personal-care': '/listings/beauty-personal-care.jpg',
}

const listings: Record<string, Array<{
  name: string
  slug: string
  description: string
  address: string
  phone: string
  website: string
  email: string
  rating: number
  reviewCount: number
  featured: boolean
}>> = {
  'restaurants-cafes': [
    {
      name: 'Le Jardin d\'Eau',
      slug: 'le-jardin-deau',
      description: 'An elegant restaurant offering a fusion of Moroccan and French cuisine in a beautiful garden setting. Known for its fresh seafood and traditional tagines.',
      address: 'Boulevard Hassan II, Agadir 80000',
      phone: '+212 528 821 234',
      website: 'lejardindeau.ma',
      email: 'info@lejardindeau.ma',
      rating: 4.7,
      reviewCount: 342,
      featured: true,
    },
    {
      name: 'Café Clock Agadir',
      slug: 'cafe-clock-agadir',
      description: 'A vibrant cultural café serving creative Moroccan cuisine with a modern twist. Features rooftop seating with panoramic ocean views and regular cultural events.',
      address: 'Rue de la Liberté, Talborjt, Agadir 80000',
      phone: '+212 528 220 567',
      website: 'cafeclock.com',
      email: 'agadir@cafeclock.com',
      rating: 4.5,
      reviewCount: 218,
      featured: true,
    },
    {
      name: 'Pure Passion Restaurant',
      slug: 'pure-passion-restaurant',
      description: 'Beachfront restaurant specializing in fresh grilled fish and seafood platters. Enjoy your meal with stunning views of the Atlantic Ocean and Agadir bay.',
      address: 'Promenade de la Corniche, Agadir 80000',
      phone: '+212 528 840 890',
      website: 'purepassion.ma',
      email: 'reservations@purepassion.ma',
      rating: 4.6,
      reviewCount: 189,
      featured: false,
    },
    {
      name: 'La Médina',
      slug: 'la-medina-restaurant',
      description: 'Authentic Moroccan restaurant in the heart of Agadir. Famous for its lamb tagine, couscous royal, and traditional Moroccan pastries.',
      address: 'Avenue Mohammed V, Agadir 80000',
      phone: '+212 528 843 211',
      website: 'lamedina-agadir.ma',
      email: 'contact@lamedina-agadir.ma',
      rating: 4.3,
      reviewCount: 156,
      featured: false,
    },
    {
      name: 'Flamingo Beach Café',
      slug: 'flamingo-beach-cafe',
      description: 'A trendy beach café known for its smoothies, salads, and relaxed atmosphere. Perfect spot for breakfast or a sunset drink by the sea.',
      address: 'Corniche d\'Agadir, Agadir 80000',
      phone: '+212 528 821 555',
      website: 'flamingocafe.ma',
      email: 'hello@flamingocafe.ma',
      rating: 4.4,
      reviewCount: 267,
      featured: false,
    },
  ],
  'hotels-accommodation': [
    {
      name: 'Sofitel Agadir Royal Bay',
      slug: 'sofitel-agadir-royal-bay',
      description: 'Luxury 5-star resort on Agadir Bay with private beach, infinity pool, spa, and multiple dining options. The ultimate Moroccan luxury experience.',
      address: 'Boulevard du 20 Août, Agadir 80000',
      phone: '+212 528 828 600',
      website: 'sofitel-agadir.com',
      email: 'h1960@accor.com',
      rating: 4.8,
      reviewCount: 892,
      featured: true,
    },
    {
      name: 'Riu Tikida Palace',
      slug: 'riu-tikida-palace',
      description: 'All-inclusive beachfront resort featuring spacious rooms, multiple pools, a wellness center, and entertainment programs for all ages.',
      address: 'Chemin des Dunes, Agadir 80000',
      phone: '+212 528 828 500',
      website: 'riu.com',
      email: 'tikidapalace@riu.com',
      rating: 4.5,
      reviewCount: 1204,
      featured: true,
    },
    {
      name: 'Hotel Argana',
      slug: 'hotel-argana',
      description: 'Charming mid-range hotel near the city center with comfortable rooms, a rooftop terrace, and friendly service at affordable prices.',
      address: 'Avenue Hassan II, Agadir 80000',
      phone: '+212 528 842 100',
      website: 'hotelargana.ma',
      email: 'info@hotelargana.ma',
      rating: 4.1,
      reviewCount: 456,
      featured: false,
    },
    {
      name: 'Villa Tangerine',
      slug: 'villa-tangerine',
      description: 'A boutique guesthouse with a lush garden, personalized service, and a serene atmosphere. Ideal for couples and solo travelers seeking tranquility.',
      address: 'Quartier Sonaba, Agadir 80000',
      phone: '+212 661 234 567',
      website: 'villatangerine.com',
      email: 'stay@villatangerine.com',
      rating: 4.6,
      reviewCount: 128,
      featured: false,
    },
  ],
  'beaches-water-sports': [
    {
      name: 'Agadir Surf Club',
      slug: 'agadir-surf-club',
      description: 'Premier surf school and rental shop offering lessons for all levels. Experienced instructors, quality equipment, and flexible scheduling.',
      address: 'Plage d\'Agadir, Corniche, Agadir 80000',
      phone: '+212 662 345 678',
      website: 'agadirsurfclub.com',
      email: 'book@agadirsurfclub.com',
      rating: 4.8,
      reviewCount: 234,
      featured: true,
    },
    {
      name: 'Atlantic Jet Ski',
      slug: 'atlantic-jet-ski',
      description: 'Thrilling jet ski rides and water sport activities along Agadir\'s coastline. Safe, fun, and supervised by certified professionals.',
      address: 'Marina d\'Agadir, Agadir 80000',
      phone: '+212 661 456 789',
      website: 'atlanticjetski.ma',
      email: 'ride@atlanticjetski.ma',
      rating: 4.4,
      reviewCount: 167,
      featured: true,
    },
    {
      name: 'Royal Yacht Club Agadir',
      slug: 'royal-yacht-club-agadir',
      description: 'Sailing, boat tours, and fishing excursions from Agadir\'s marina. Experience the Atlantic Ocean with professional skippers and top-notch equipment.',
      address: 'Marina d\'Agadir, Agadir 80000',
      phone: '+212 528 839 100',
      website: 'yachtclubagadir.ma',
      email: 'info@yachtclubagadir.ma',
      rating: 4.6,
      reviewCount: 98,
      featured: false,
    },
  ],
  'shopping-markets': [
    {
      name: 'Souk El Had',
      slug: 'souk-el-had',
      description: 'Agadir\'s largest and most vibrant traditional market. Over 3,000 stalls selling spices, crafts, clothing, leather goods, and fresh produce.',
      address: 'Rue des F.A.R, Agadir 80000',
      phone: '+212 528 844 500',
      website: '',
      email: '',
      rating: 4.5,
      reviewCount: 567,
      featured: true,
    },
    {
      name: 'Marjane Agadir',
      slug: 'marjane-agadir',
      description: 'Modern hypermarket and shopping complex with a wide range of international and local brands, electronics, groceries, and household goods.',
      address: 'Avenue Hassan II, Agadir 80000',
      phone: '+212 528 845 000',
      website: 'marjane.ma',
      email: '',
      rating: 4.2,
      reviewCount: 345,
      featured: false,
    },
    {
      name: 'Coco Polizzi',
      slug: 'coco-polizzi',
      description: 'Charming artisanal shopping village designed like a medina. Features local artisans selling handmade jewelry, pottery, and traditional crafts.',
      address: 'Route d\'Inezgane, Agadir 80000',
      phone: '+212 528 282 000',
      website: 'cocopolizzi.com',
      email: 'info@cocopolizzi.com',
      rating: 4.6,
      reviewCount: 289,
      featured: true,
    },
  ],
  'health-wellness': [
    {
      name: 'Clinique du Souss',
      slug: 'clinique-du-souss',
      description: 'Leading private clinic in Agadir offering comprehensive medical services including emergency care, surgery, and specialized treatments.',
      address: 'Boulevard Mohammed V, Agadir 80000',
      phone: '+212 528 847 000',
      website: 'cliniquedusouss.ma',
      email: 'contact@cliniquedusouss.ma',
      rating: 4.3,
      reviewCount: 178,
      featured: true,
    },
    {
      name: 'Spa Argan & Sens',
      slug: 'spa-argan-sens',
      description: 'Luxury spa offering traditional hammam, argan oil treatments, massages, and beauty rituals. The perfect place to relax and rejuvenate.',
      address: 'Marina d\'Agadir, Agadir 80000',
      phone: '+212 528 829 500',
      website: 'spaargansens.ma',
      email: 'relax@spaargansens.ma',
      rating: 4.7,
      reviewCount: 312,
      featured: true,
    },
  ],
  'education-training': [
    {
      name: 'Université Ibn Zohr',
      slug: 'universite-ibn-zohr',
      description: 'Agadir\'s premier university offering undergraduate and graduate programs across multiple faculties including sciences, law, and humanities.',
      address: 'B.P. 8106, Agadir 80000',
      phone: '+212 528 220 000',
      website: 'uiz.ac.ma',
      email: 'info@uiz.ac.ma',
      rating: 4.2,
      reviewCount: 456,
      featured: true,
    },
    {
      name: 'British Language Center',
      slug: 'british-language-center',
      description: 'Leading English language school in Agadir offering courses for all levels from beginner to advanced, plus IELTS and TOEFL preparation.',
      address: 'Rue de la Liberté, Agadir 80000',
      phone: '+212 528 843 700',
      website: 'blc-agadir.com',
      email: 'learn@blc-agadir.com',
      rating: 4.5,
      reviewCount: 189,
      featured: false,
    },
  ],
  'transport-car-rental': [
    {
      name: 'Hertz Agadir',
      slug: 'hertz-agadir',
      description: 'International car rental service at Agadir Al Massira Airport and city center. Wide fleet of vehicles from economy to luxury.',
      address: 'Aéroport Al Massira, Agadir',
      phone: '+212 528 839 800',
      website: 'hertz.ma',
      email: 'agadir@hertz.ma',
      rating: 4.1,
      reviewCount: 234,
      featured: true,
    },
    {
      name: 'Agadir Taxi Service',
      slug: 'agadir-taxi-service',
      description: 'Reliable taxi and airport transfer service with English-speaking drivers. Pre-book your ride for hassle-free travel in and around Agadir.',
      address: 'Aéroport Al Massira, Agadir',
      phone: '+212 661 789 012',
      website: 'agadirtaxi.com',
      email: 'book@agadirtaxi.com',
      rating: 4.3,
      reviewCount: 167,
      featured: false,
    },
  ],
  'professional-services': [
    {
      name: 'Cabinet Juridique Souss',
      slug: 'cabinet-juridique-souss',
      description: 'Experienced law firm specializing in Moroccan business law, real estate transactions, and expatriate legal services in the Agadir region.',
      address: 'Immeuble Atlas, Avenue Mohammed V, Agadir 80000',
      phone: '+212 528 844 300',
      website: 'cabinetsouss.ma',
      email: 'contact@cabinetsouss.ma',
      rating: 4.4,
      reviewCount: 89,
      featured: true,
    },
    {
      name: 'Agadir Immobilier',
      slug: 'agadir-immobilier',
      description: 'Trusted real estate agency helping you find apartments, villas, and commercial properties in Agadir. Buy, sell, or rent with confidence.',
      address: 'Boulevard Hassan II, Agadir 80000',
      phone: '+212 528 843 450',
      website: 'agadirimmobilier.ma',
      email: 'info@agadirimmobilier.ma',
      rating: 4.2,
      reviewCount: 134,
      featured: true,
    },
  ],
  'nightlife-entertainment': [
    {
      name: 'Flamingo Casino',
      slug: 'flamingo-casino',
      description: 'Agadir\'s premier entertainment venue featuring slot machines, table games, live music, and a stylish bar. Open late every night.',
      address: 'Boulevard du 20 Août, Agadir 80000',
      phone: '+212 528 821 600',
      website: 'flamingocasino.ma',
      email: 'info@flamingocasino.ma',
      rating: 4.0,
      reviewCount: 278,
      featured: true,
    },
    {
      name: 'So Night Lounge',
      slug: 'so-night-lounge',
      description: 'Trendy nightclub and lounge with resident DJs, signature cocktails, and a vibrant atmosphere. The hottest nightlife spot on the Corniche.',
      address: 'Corniche d\'Agadir, Agadir 80000',
      phone: '+212 661 234 890',
      website: '',
      email: '',
      rating: 4.3,
      reviewCount: 189,
      featured: false,
    },
  ],
  'tours-excursions': [
    {
      name: 'Evasion Souss Tours',
      slug: 'evasion-souss-tours',
      description: 'Expert tour operator offering desert excursions, Atlas Mountain trips, and coastal adventures from Agadir. Small groups, big experiences.',
      address: 'Avenue Hassan II, Agadir 80000',
      phone: '+212 662 567 890',
      website: 'evasionsouss.com',
      email: 'book@evasionsouss.com',
      rating: 4.8,
      reviewCount: 423,
      featured: true,
    },
    {
      name: 'Paradise Valley Trip',
      slug: 'paradise-valley-trip',
      description: 'Guided day trips to the stunning Paradise Valley natural pools. Swim in crystal-clear water surrounded by palm trees and dramatic rock formations.',
      address: 'Departure from Agadir Marina, Agadir 80000',
      phone: '+212 661 678 901',
      website: 'paradisevalleytrip.ma',
      email: 'info@paradisevalleytrip.ma',
      rating: 4.6,
      reviewCount: 312,
      featured: true,
    },
  ],
  'home-services': [
    {
      name: 'Agadir Plomberie Express',
      slug: 'agadir-plomberie-express',
      description: 'Fast and reliable plumbing services in Agadir. Emergency repairs, installations, and maintenance for homes and businesses.',
      address: 'Quartier Yachech, Agadir 80000',
      phone: '+212 662 789 012',
      website: '',
      email: 'plomberie.express@gmail.com',
      rating: 4.2,
      reviewCount: 78,
      featured: false,
    },
    {
      name: 'Clean House Agadir',
      slug: 'clean-house-agadir',
      description: 'Professional cleaning service for homes, offices, and vacation rentals. Trusted, thorough, and available on flexible schedules.',
      address: 'Hay Mohammadi, Agadir 80000',
      phone: '+212 661 890 123',
      website: 'cleanhouseagadir.ma',
      email: 'book@cleanhouseagadir.ma',
      rating: 4.4,
      reviewCount: 145,
      featured: true,
    },
  ],
  'beauty-personal-care': [
    {
      name: 'Salon Chahinez',
      slug: 'salon-chahinez',
      description: 'Upscale hair and beauty salon offering cuts, coloring, bridal packages, and traditional Moroccan beauty treatments in a modern setting.',
      address: 'Boulevard Hassan II, Agadir 80000',
      phone: '+212 662 890 234',
      website: '',
      email: 'salonchahinez@gmail.com',
      rating: 4.5,
      reviewCount: 198,
      featured: true,
    },
    {
      name: 'Hammam Oasis',
      slug: 'hammam-oasis',
      description: 'Authentic Moroccan hammam experience with black soap scrub, ghassoul clay wraps, and relaxing massages. A must-try cultural wellness ritual.',
      address: 'Talborjt, Agadir 80000',
      phone: '+212 528 842 800',
      website: 'hammamoasis.ma',
      email: 'relax@hammamoasis.ma',
      rating: 4.6,
      reviewCount: 267,
      featured: true,
    },
  ],
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const authed = await isAuthenticated()
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if already seeded
    const existingCategories = await db.category.count()
    if (existingCategories > 0) {
      return NextResponse.json({ message: 'Database already seeded', categories: existingCategories })
    }

    // Seed categories and listings
    for (const cat of categories) {
      const category = await db.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          description: cat.description,
        },
      })

      const catListings = listings[cat.slug] || []
      const catImage = categoryImages[cat.slug] || null
      for (const listing of catListings) {
        await db.listing.create({
          data: {
            name: listing.name,
            slug: listing.slug,
            description: listing.description,
            address: listing.address,
            phone: listing.phone || null,
            website: listing.website || null,
            email: listing.email || null,
            image: catImage,
            rating: listing.rating,
            reviewCount: listing.reviewCount,
            featured: listing.featured,
            categoryId: category.id,
          },
        })
      }
    }

    // Seed sample reviews for each listing
    const allListings = await db.listing.findMany()
    const sampleReviews = [
      { authorName: 'Ahmed B.', rating: 5, comment: 'Absolutely amazing experience! The service was top-notch and I would highly recommend this place to anyone visiting Agadir.' },
      { authorName: 'Sarah M.', rating: 4, comment: 'Great place with a wonderful atmosphere. The staff was friendly and attentive. Would definitely come back again!' },
      { authorName: 'Youssef K.', rating: 5, comment: 'One of the best in Agadir! Clean, professional, and exceeded all my expectations. A must-visit!' },
      { authorName: 'Marie L.', rating: 4, comment: 'Really enjoyed my visit. The quality is excellent and the prices are fair. Only minor issues with wait times.' },
      { authorName: 'Omar H.', rating: 3, comment: 'Decent experience overall. Some things could be improved but the core service was good. Average for the area.' },
      { authorName: 'Fatima Z.', rating: 5, comment: 'Outstanding! This is exactly what Agadir needed. Professional, clean, and the team really cares about quality.' },
      { authorName: 'Jean-Pierre D.', rating: 4, comment: 'Very good service and friendly staff. The location is convenient and easy to find. Recommended for tourists.' },
      { authorName: 'Khadija A.', rating: 5, comment: 'I have been coming here for years and it never disappoints. Consistently excellent quality and service.' },
    ]

    for (const listing of allListings) {
      // Add 2-4 random reviews per listing
      const numReviews = 2 + Math.floor(Math.random() * 3)
      for (let i = 0; i < numReviews; i++) {
        const sample = sampleReviews[Math.floor(Math.random() * sampleReviews.length)]
        await db.review.create({
          data: {
            authorName: sample.authorName,
            rating: sample.rating,
            comment: sample.comment,
            listingId: listing.id,
            approved: true, // Seed reviews are pre-approved
          },
        })
      }
    }

    const totalCategories = await db.category.count()
    const totalListings = await db.listing.count()
    const totalReviews = await db.review.count()

    return NextResponse.json({
      message: 'Database seeded successfully!',
      categories: totalCategories,
      listings: totalListings,
      reviews: totalReviews,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
