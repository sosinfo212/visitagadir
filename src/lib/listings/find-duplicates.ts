export function normalizeListingName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeListingPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8) return null
  return digits
}

export type DuplicateListingSummary = {
  id: string
  name: string
  slug: string
  phone: string | null
  address: string
  published: boolean
  category: { name: string }
}

export type DuplicateGroup = {
  type: 'name' | 'phone'
  key: string
  displayKey: string
  listings: DuplicateListingSummary[]
}

type ListingRow = DuplicateListingSummary

function groupByKey(
  listings: ListingRow[],
  type: 'name' | 'phone',
  getKey: (listing: ListingRow) => string | null,
  formatDisplay: (key: string, sample: ListingRow) => string,
): DuplicateGroup[] {
  const buckets = new Map<string, ListingRow[]>()

  for (const listing of listings) {
    const key = getKey(listing)
    if (!key) continue
    const bucket = buckets.get(key)
    if (bucket) bucket.push(listing)
    else buckets.set(key, [listing])
  }

  const groups: DuplicateGroup[] = []
  for (const [key, items] of buckets) {
    if (items.length < 2) continue
    groups.push({
      type,
      key,
      displayKey: formatDisplay(key, items[0]),
      listings: items.sort((a, b) => a.name.localeCompare(b.name)),
    })
  }

  return groups.sort((a, b) => b.listings.length - a.listings.length || a.displayKey.localeCompare(b.displayKey))
}

export function findDuplicateListingGroups(listings: ListingRow[]): {
  groups: DuplicateGroup[]
  duplicateListingIds: Set<string>
} {
  const nameGroups = groupByKey(
    listings,
    'name',
    (listing) => {
      const key = normalizeListingName(listing.name)
      return key.length >= 2 ? key : null
    },
    (_key, sample) => sample.name.trim(),
  )

  const phoneGroups = groupByKey(
    listings,
    'phone',
    (listing) => normalizeListingPhone(listing.phone),
    (key, sample) => sample.phone?.trim() || key,
  )

  const groups = [...nameGroups, ...phoneGroups]
  const duplicateListingIds = new Set<string>()
  for (const group of groups) {
    for (const listing of group.listings) {
      duplicateListingIds.add(listing.id)
    }
  }

  return { groups, duplicateListingIds }
}
