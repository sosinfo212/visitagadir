/**
 * Repository for SEO singletons.
 *
 * Why a repository? The first call to any settings page should never fail
 * because the row is missing. These helpers transparently seed a default
 * row when needed and cache the result so every server-side render of every
 * page is cheap (`O(1)` after first hit, 60s TTL).
 *
 * Invalidate by calling cacheInvalidate('seo:') after a PUT.
 */

import { db } from '@/lib/db'
import { cacheGet, cacheSet, cacheInvalidate } from './cache'
import type { SeoSettings, SchemaSettings, Redirect } from '@prisma/client'

const TTL_MS = 60_000 // 60s — settings rarely change

const KEY_SEO = 'seo:settings'
const KEY_SCHEMA = 'seo:schema'
const KEY_REDIRECTS = 'seo:redirects'

// ─── SeoSettings ─────────────────────────────────────────

const SEO_DEFAULT_DESCRIPTION =
  'Discover the best restaurants, hotels, beaches, shops, services, and more in Agadir, Morocco.'

export async function getSeoSettings(): Promise<SeoSettings> {
  const cached = cacheGet<SeoSettings>(KEY_SEO)
  if (cached) return cached

  let row = await db.seoSettings.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!row) {
    row = await db.seoSettings.create({
      data: { defaultDescription: SEO_DEFAULT_DESCRIPTION },
    })
  }
  row = applySiteUrlEnvOverride(row)
  cacheSet(KEY_SEO, row, TTL_MS)
  return row
}

/** Prefer env site URL in production when DB still has localhost defaults. */
function applySiteUrlEnvOverride(row: SeoSettings): SeoSettings {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL
  if (!envUrl) return row

  let parsed: URL
  try {
    parsed = new URL(envUrl)
  } catch {
    return row
  }

  const envOrigin = parsed.origin
  const dbIsLocalhost =
    row.siteUrl.includes('localhost') || row.canonicalDomain.includes('localhost')

  if (!dbIsLocalhost) return row

  return {
    ...row,
    siteUrl: envOrigin,
    canonicalDomain: envOrigin,
  }
}

export async function updateSeoSettings(
  patch: Partial<Omit<SeoSettings, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<SeoSettings> {
  const existing = await getSeoSettings()
  const updated = await db.seoSettings.update({
    where: { id: existing.id },
    data: patch,
  })
  cacheInvalidate('seo:')
  return updated
}

// ─── SchemaSettings ──────────────────────────────────────

export async function getSchemaSettings(): Promise<SchemaSettings> {
  const cached = cacheGet<SchemaSettings>(KEY_SCHEMA)
  if (cached) return cached

  let row = await db.schemaSettings.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!row) row = await db.schemaSettings.create({ data: {} })
  cacheSet(KEY_SCHEMA, row, TTL_MS)
  return row
}

export async function updateSchemaSettings(
  patch: Partial<Omit<SchemaSettings, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<SchemaSettings> {
  const existing = await getSchemaSettings()
  const updated = await db.schemaSettings.update({
    where: { id: existing.id },
    data: patch,
  })
  cacheInvalidate('seo:')
  return updated
}

// ─── Redirects ───────────────────────────────────────────

/**
 * Resolve a single redirect for a path. Hit on every proxy request so we
 * use a direct indexed lookup (the `Redirect.source` column is unique →
 * single-row read). For a >5k-RPS deployment, switch to a versioned
 * in-memory map invalidated via Redis pub/sub — same interface.
 */
export async function findRedirect(source: string): Promise<Redirect | null> {
  try {
    return await db.redirect.findUnique({ where: { source } })
  } catch {
    return null
  }
}

/**
 * Returns the full enabled-map. Used by admin "preview" surfaces (e.g.
 * showing how many redirects are live). The proxy uses `findRedirect`
 * instead so it stays correct without cache-invalidation gymnastics.
 */
export async function getRedirectsMap(): Promise<Map<string, Redirect>> {
  const cached = cacheGet<Map<string, Redirect>>(KEY_REDIRECTS)
  if (cached) return cached

  const rows = await db.redirect.findMany({ where: { enabled: true } })
  const map = new Map<string, Redirect>()
  for (const r of rows) map.set(r.source, r)
  cacheSet(KEY_REDIRECTS, map, TTL_MS)
  return map
}

export async function listRedirects(): Promise<Redirect[]> {
  return db.redirect.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function createRedirect(data: {
  source: string
  destination: string
  statusCode?: number
  enabled?: boolean
}): Promise<Redirect> {
  const row = await db.redirect.create({
    data: {
      source: normalizePath(data.source),
      destination: data.destination.trim(),
      statusCode: data.statusCode ?? 301,
      enabled: data.enabled ?? true,
    },
  })
  cacheInvalidate('seo:redirects')
  return row
}

export async function updateRedirect(id: string, data: Partial<{
  source: string
  destination: string
  statusCode: number
  enabled: boolean
}>): Promise<Redirect> {
  const patch: Record<string, unknown> = {}
  if (data.source !== undefined) patch.source = normalizePath(data.source)
  if (data.destination !== undefined) patch.destination = data.destination.trim()
  if (data.statusCode !== undefined) patch.statusCode = data.statusCode
  if (data.enabled !== undefined) patch.enabled = data.enabled
  const row = await db.redirect.update({ where: { id }, data: patch })
  cacheInvalidate('seo:redirects')
  return row
}

export async function deleteRedirect(id: string): Promise<void> {
  await db.redirect.delete({ where: { id } })
  cacheInvalidate('seo:redirects')
}

export async function incrementRedirectHits(id: string): Promise<void> {
  // Fire-and-forget — best-effort metric.
  try {
    await db.redirect.update({ where: { id }, data: { hits: { increment: 1 } } })
  } catch { /* ignore */ }
}

// ─── Helpers ─────────────────────────────────────────────

function normalizePath(p: string): string {
  const trimmed = p.trim()
  if (!trimmed) return '/'
  // Allow absolute URLs as source (rare) — only normalize relative ones.
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}
