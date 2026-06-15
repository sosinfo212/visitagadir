import { slugify, isValidSlug } from '@/lib/blog/slug'
import type { WpCategoryRef } from '@/lib/blog/wordpress-parser'

export interface WpCategoryMapping {
  name: string
  slug: string
  icon: string
  defaultSchemaType?: string
}

/** Prefer mapping WP taxonomy slugs onto existing app categories when possible. */
const WP_TO_APP_CATEGORY: Record<string, WpCategoryMapping> = {
  hotel: { name: 'Hotels & Accommodation', slug: 'hotels-accommodation', icon: 'Hotel', defaultSchemaType: 'Hotel' },
  accommodation: { name: 'Hotels & Accommodation', slug: 'hotels-accommodation', icon: 'Hotel', defaultSchemaType: 'LodgingBusiness' },
  'food-restaurants': { name: 'Restaurants & Cafés', slug: 'restaurants-cafes', icon: 'UtensilsCrossed', defaultSchemaType: 'Restaurant' },
  entertainment: { name: 'Nightlife & Entertainment', slug: 'nightlife-entertainment', icon: 'Music', defaultSchemaType: 'EventVenue' },
  intertainment: { name: 'Nightlife & Entertainment', slug: 'nightlife-entertainment', icon: 'Music', defaultSchemaType: 'EventVenue' },
  sport: { name: 'Beaches & Water Sports', slug: 'beaches-water-sports', icon: 'Waves', defaultSchemaType: 'SportsActivityLocation' },
  shopping: { name: 'Shopping & Markets', slug: 'shopping-markets', icon: 'ShoppingBag', defaultSchemaType: 'Store' },
  'health-care': { name: 'Health & Wellness', slug: 'health-wellness', icon: 'Heart', defaultSchemaType: 'MedicalBusiness' },
  education: { name: 'Education & Training', slug: 'education-training', icon: 'GraduationCap', defaultSchemaType: 'School' },
  beauty: { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', icon: 'Sparkles', defaultSchemaType: 'BeautySalon' },
  business: { name: 'Professional Services', slug: 'professional-services', icon: 'Briefcase', defaultSchemaType: 'ProfessionalService' },
  'travel-tour': { name: 'Tours & Excursions', slug: 'tours-excursions', icon: 'Compass', defaultSchemaType: 'TravelAgency' },
  government: { name: 'Professional Services', slug: 'professional-services', icon: 'Briefcase', defaultSchemaType: 'GovernmentOffice' },
}

const SCHEMA_BY_WP: Record<string, string> = {
  hotel: 'Hotel',
  accommodation: 'LodgingBusiness',
  'food-restaurants': 'Restaurant',
  entertainment: 'EventVenue',
  intertainment: 'EventVenue',
  sport: 'SportsActivityLocation',
  shopping: 'Store',
  'health-care': 'MedicalBusiness',
  education: 'School',
  beauty: 'BeautySalon',
  business: 'ProfessionalService',
  'travel-tour': 'TravelAgency',
  government: 'GovernmentOffice',
}

export function pickListingCategory(categories: WpCategoryRef[]): WpCategoryMapping | null {
  const wpCat = categories.find((c) => c.domain === 'job_listing_category')
  if (!wpCat) return null

  const nicename = wpCat.nicename?.trim()
  if (nicename && WP_TO_APP_CATEGORY[nicename]) {
    return WP_TO_APP_CATEGORY[nicename]
  }

  const slug = nicename || slugify(wpCat.name)
  if (!isValidSlug(slug)) return null

  return {
    name: wpCat.name || slug,
    slug,
    icon: 'Building2',
    defaultSchemaType: SCHEMA_BY_WP[slug] ?? 'LocalBusiness',
  }
}
