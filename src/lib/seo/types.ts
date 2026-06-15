/**
 * Shared types for the SEO module.
 */

export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'youtube'
  | 'twitter'
  | 'tiktok'
  | 'pinterest'
  | 'whatsapp'

export interface SocialProfile {
  platform: SocialPlatform
  url: string
  enabled: boolean
}

export interface OpeningHoursSpec {
  // schema.org accepts a day or an array of days
  dayOfWeek: string[] | string
  opens: string  // "09:00"
  closes: string // "18:00"
}

/**
 * Catalog of friendly schema.org type aliases offered in the admin UI.
 * Keys are the user-facing labels; values are the schema.org @type values.
 *
 * Editing this list is the only place needed to add support for a new
 * vertical (e.g. "Pharmacy" -> "Pharmacy", "Dentist" -> "Dentist").
 */
export const SCHEMA_TYPE_CATALOG: Record<string, string> = {
  'Local Business (generic)': 'LocalBusiness',
  'Beauty Salon': 'BeautySalon',
  'Day Spa': 'DaySpa',
  'Hair Salon': 'HairSalon',
  'Health & Beauty Business': 'HealthAndBeautyBusiness',
  'Restaurant': 'Restaurant',
  'Cafe / Coffee Shop': 'CafeOrCoffeeShop',
  'Bakery': 'Bakery',
  'Bar / Pub': 'BarOrPub',
  'Food Establishment': 'FoodEstablishment',
  'Hotel': 'Hotel',
  'Lodging Business': 'LodgingBusiness',
  'Resort': 'Resort',
  'Bed & Breakfast': 'BedAndBreakfast',
  'Travel Agency': 'TravelAgency',
  'Tourist Information Center': 'TouristInformationCenter',
  'Tourist Attraction': 'TouristAttraction',
  'Store (generic)': 'Store',
  'Shopping Center': 'ShoppingCenter',
  'Clothing Store': 'ClothingStore',
  'Electronics Store': 'ElectronicsStore',
  'Grocery Store': 'GroceryStore',
  'Gym / Sports Activity': 'SportsActivityLocation',
  'Health Club': 'HealthClub',
  'Auto Rental': 'AutoRental',
  'Auto Repair': 'AutoRepair',
  'Real Estate Agent': 'RealEstateAgent',
  'Educational Organization': 'EducationalOrganization',
  'School': 'School',
  'Medical Business': 'MedicalBusiness',
  'Dentist': 'Dentist',
  'Physician': 'Physician',
  'Pharmacy': 'Pharmacy',
  'Bank / Financial Service': 'BankOrCreditUnion',
  'Professional Service': 'ProfessionalService',
  'Home & Construction': 'HomeAndConstructionBusiness',
  'Plumber': 'Plumber',
  'Electrician': 'Electrician',
  'Roofing Contractor': 'RoofingContractor',
  'Locksmith': 'Locksmith',
  'Moving Company': 'MovingCompany',
  'Event Venue': 'EventVenue',
  'Night Club': 'NightClub',
  'Museum': 'Museum',
  'Park': 'Park',
}

export function safeSchemaType(value: string | null | undefined, fallback = 'LocalBusiness'): string {
  if (!value) return fallback
  // Only allow alphanumerics — guards against bad data injecting odd @type values.
  return /^[A-Za-z]+$/.test(value) ? value : fallback
}

export function parseSocialProfiles(raw: string | null | undefined): SocialProfile[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((p): p is SocialProfile =>
        p && typeof p === 'object' &&
        typeof p.platform === 'string' &&
        typeof p.url === 'string'
      )
      .map(p => ({ ...p, enabled: p.enabled !== false }))
  } catch {
    return []
  }
}

export function parseOpeningHours(raw: string | null | undefined): OpeningHoursSpec[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((h): h is OpeningHoursSpec =>
      h && typeof h === 'object' &&
      (typeof h.dayOfWeek === 'string' || Array.isArray(h.dayOfWeek)) &&
      typeof h.opens === 'string' &&
      typeof h.closes === 'string'
    )
  } catch {
    return []
  }
}
