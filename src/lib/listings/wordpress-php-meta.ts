const WP_DAY_INDEX: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

export interface OpeningHourRow {
  dayOfWeek: string[]
  opens: string
  closes: string
}

/** Extract numeric attachment IDs from PHP-serialized arrays like a:2:{i:0;s:4:"1774";...} */
export function parsePhpAttachmentIds(serialized: string | undefined | null): string[] {
  if (!serialized?.trim()) return []
  const ids: string[] = []
  const re = /s:\d+:"(\d+)"/g
  for (const match of serialized.matchAll(re)) {
    ids.push(match[1])
  }
  return ids
}

/** Map WP Job Manager price range values to schema.org priceRange tokens. */
export function mapPriceRange(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null
  const value = raw.trim().toLowerCase()
  const map: Record<string, string> = {
    inexpensive: '$',
    moderate: '$$',
    expensive: '$$$',
    very_expensive: '$$$$',
    'very-expensive': '$$$$',
    notsay: '',
  }
  const mapped = map[value]
  if (mapped === '') return null
  return mapped ?? null
}

/** Parse WP `_job_hours` PHP serialized structure into JSON-LD opening hours rows. */
export function parseJobHours(serialized: string | undefined | null): OpeningHourRow[] {
  if (!serialized?.trim()) return []

  const rows: OpeningHourRow[] = []
  for (let dayIdx = 0; dayIdx <= 6; dayIdx += 1) {
    const blockRe = new RegExp(
      `i:${dayIdx};a:3:\\{[\\s\\S]*?s:4:"from";a:1:\\{i:0;s:\\d+:"([^"]*)"[\\s\\S]*?s:2:"to";a:1:\\{i:0;s:\\d+:"([^"]*)"`,
    )
    const match = serialized.match(blockRe)
    if (!match) continue

    const opens = match[1]?.trim() || '00:00'
    const closes = match[2]?.trim() || '23:59'
    const day = WP_DAY_INDEX[dayIdx]
    if (!day) continue

    rows.push({ dayOfWeek: [day], opens, closes })
  }

  return rows
}

export function parseCoordinate(raw: string | undefined | null): number | null {
  if (!raw?.trim()) return null
  const value = Number.parseFloat(raw.trim())
  return Number.isFinite(value) ? value : null
}

/** Pull city and postal code from a free-text Moroccan address when possible. */
export function parseAddressParts(address: string): {
  city: string
  postalCode: string | null
  country: string
} {
  const cityMatch = address.match(/,\s*Agadir(?:\s+(\d{5}))?/i)
  const postalCode = cityMatch?.[1] ?? null
  const country = /morocco/i.test(address) ? 'MA' : 'MA'
  return { city: 'Agadir', postalCode, country }
}
