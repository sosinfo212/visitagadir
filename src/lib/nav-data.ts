/**
 * Server-side navigation data (header + footer category lists).
 *
 * Fetched once per request in the root layout and passed down as props so the
 * client header/footer no longer each fire `/api/categories` on mount. Cached
 * in-process (5 min TTL) to keep the added layout query effectively free.
 */

import { db } from '@/lib/db'
import { cacheGet, cacheSet } from '@/lib/seo/cache'

export interface NavCategory {
  id: string
  name: string
  slug: string
  icon: string
  description: string
  listingCount: number
}

const KEY = 'nav:categories'
const TTL_MS = 300_000 // 5 min — category list changes rarely

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
