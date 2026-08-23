/**
 * Server-side navigation data (header + footer category lists).
 *
 * Fetched once per request in the root layout and passed down as props so the
 * client header/footer no longer each fire `/api/categories` on mount. Cached
 * in-process (5 min TTL) to keep the added layout query effectively free.
 */

import { db } from '@/lib/db'
import { cacheGet, cacheSet } from '@/lib/seo/cache'
import { getCitiesWithCounts } from '@/lib/seo/internal-linking'
import { citySlug } from '@/lib/seo/url'

export interface NavCategory {
  id: string
  name: string
  slug: string
  icon: string
  description: string
  listingCount: number
}

export interface NavCity {
  city: string
  slug: string
  count: number
}

const KEY = 'nav:categories'
const TTL_MS = 300_000 // 5 min — category list changes rarely
const CITIES_KEY = 'nav:cities'

export async function getNavCategories(): Promise<NavCategory[]> {
  const cached = cacheGet<NavCategory[]>(KEY)
  if (cached) return cached

  const rows = await db.category.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      description: true,
      _count: { select: { listings: true } },
    },
  })

  const out: NavCategory[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    icon: r.icon,
    description: r.description ?? '',
    listingCount: r._count.listings,
  }))

  cacheSet(KEY, out, TTL_MS)
  return out
}

/**
 * Top cities for the footer "Browse by city" block. Gives the city hub pages
 * (/city/<slug>) an internal link from every page — they were otherwise
 * orphaned from the homepage. Cached like the category nav.
 */
export async function getNavCities(limit = 8): Promise<NavCity[]> {
  const cached = cacheGet<NavCity[]>(CITIES_KEY)
  if (cached) return cached

  const rows = await getCitiesWithCounts(50)
  const out: NavCity[] = rows
    .filter((r) => r.city?.trim() && r.count >= 3)
    .slice(0, limit)
    .map((r) => ({ city: r.city, slug: citySlug(r.city), count: r.count }))

  cacheSet(CITIES_KEY, out, TTL_MS)
  return out
}
