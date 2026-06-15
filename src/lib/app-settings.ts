import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/seo/cache'
import { getSeoSettings, updateSeoSettings, updateSchemaSettings } from '@/lib/seo/repository'

const KEY = 'app:settings'
const TTL_MS = 60_000

export type AppSettingsPublic = {
  siteName: string
  siteLogoUrl: string
  siteLogoWidth: number
  siteLogoHeight: number
  faviconUrl: string
  footerLogoUrl: string
  footerLogoWidth: number
  footerLogoHeight: number
}

export type AppSettingsAdmin = AppSettingsPublic & {
  adminName: string
  adminEmail: string
  hasCustomPassword: boolean
}

async function ensureRow() {
  let row = await db.appSettings.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!row) {
    row = await db.appSettings.create({ data: {} })
  }
  return row
}

export async function getAppSettings() {
  const cached = cacheGet<Awaited<ReturnType<typeof ensureRow>>>(KEY)
  if (cached) return cached
  const row = await ensureRow()
  cacheSet(KEY, row, TTL_MS)
  return row
}

export function toPublicSettings(row: Awaited<ReturnType<typeof getAppSettings>>): AppSettingsPublic {
  return {
    siteName: row.siteName,
    siteLogoUrl: row.siteLogoUrl,
    siteLogoWidth: row.siteLogoWidth,
    siteLogoHeight: row.siteLogoHeight,
    faviconUrl: row.faviconUrl,
    footerLogoUrl: row.footerLogoUrl,
    footerLogoWidth: row.footerLogoWidth,
    footerLogoHeight: row.footerLogoHeight,
  }
}

export function toAdminSettings(row: Awaited<ReturnType<typeof getAppSettings>>): AppSettingsAdmin {
  return {
    ...toPublicSettings(row),
    adminName: row.adminName,
    adminEmail: row.adminEmail,
    hasCustomPassword: !!row.passwordHash,
  }
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const settings = await getAppSettings()
  if (settings.passwordHash) {
    return bcrypt.compare(password, settings.passwordHash)
  }
  const envPassword = process.env.ADMIN_PASSWORD || 'agadir2024'
  return password === envPassword
}

export async function updateAppSettings(patch: {
  siteName?: string
  siteLogoUrl?: string
  siteLogoWidth?: number
  siteLogoHeight?: number
  faviconUrl?: string
  footerLogoUrl?: string
  footerLogoWidth?: number
  footerLogoHeight?: number
  adminName?: string
  adminEmail?: string
  currentPassword?: string
  newPassword?: string
}) {
  const existing = await getAppSettings()

  const data: Record<string, unknown> = {}

  if (patch.siteName !== undefined) {
    const name = patch.siteName.trim()
    if (!name) throw new Error('Site name is required.')
    data.siteName = name
  }

  if (patch.siteLogoUrl !== undefined) {
    const url = patch.siteLogoUrl.trim()
    if (!url) throw new Error('Site logo URL is required.')
    data.siteLogoUrl = url
  }

  if (patch.siteLogoWidth !== undefined) {
    const w = Number(patch.siteLogoWidth)
    if (!Number.isFinite(w) || w < 16 || w > 512) {
      throw new Error('Logo width must be between 16 and 512 pixels.')
    }
    data.siteLogoWidth = Math.round(w)
  }

  if (patch.siteLogoHeight !== undefined) {
    const h = Number(patch.siteLogoHeight)
    if (!Number.isFinite(h) || h < 16 || h > 512) {
      throw new Error('Logo height must be between 16 and 512 pixels.')
    }
    data.siteLogoHeight = Math.round(h)
  }

  if (patch.faviconUrl !== undefined) {
    const url = patch.faviconUrl.trim()
    if (!url) throw new Error('Favicon URL is required.')
    data.faviconUrl = url
  }

  if (patch.footerLogoUrl !== undefined) {
    const url = patch.footerLogoUrl.trim()
    if (!url) throw new Error('Footer logo URL is required.')
    data.footerLogoUrl = url
  }

  if (patch.footerLogoWidth !== undefined) {
    const w = Number(patch.footerLogoWidth)
    if (!Number.isFinite(w) || w < 16 || w > 512) {
      throw new Error('Footer logo width must be between 16 and 512 pixels.')
    }
    data.footerLogoWidth = Math.round(w)
  }

  if (patch.footerLogoHeight !== undefined) {
    const h = Number(patch.footerLogoHeight)
    if (!Number.isFinite(h) || h < 16 || h > 512) {
      throw new Error('Footer logo height must be between 16 and 512 pixels.')
    }
    data.footerLogoHeight = Math.round(h)
  }

  if (patch.adminName !== undefined) {
    const name = patch.adminName.trim()
    if (!name) throw new Error('Admin name is required.')
    data.adminName = name
  }

  if (patch.adminEmail !== undefined) {
    const email = patch.adminEmail.trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('A valid admin email is required.')
    }
    data.adminEmail = email
  }

  if (patch.newPassword !== undefined) {
    const next = patch.newPassword
    if (next.length < 8) throw new Error('New password must be at least 8 characters.')
    const current = patch.currentPassword ?? ''
    const valid = await verifyAdminPassword(current)
    if (!valid) throw new Error('Current password is incorrect.')
    data.passwordHash = await bcrypt.hash(next, 12)
  }

  if (Object.keys(data).length === 0) {
    return existing
  }

  const updated = await db.appSettings.update({
    where: { id: existing.id },
    data,
  })
  cacheInvalidate('app:')

  // Keep SEO / schema branding in sync with app settings
  const seoPatch: Record<string, string> = {}
  if (typeof data.siteName === 'string') {
    seoPatch.siteName = data.siteName
    const seo = await getSeoSettings()
    if (seo.defaultTitle.includes(existing.siteName)) {
      seoPatch.defaultTitle = seo.defaultTitle.replace(existing.siteName, data.siteName)
    }
  }
  if (typeof data.faviconUrl === 'string') {
    seoPatch.faviconUrl = data.faviconUrl
  }
  if (Object.keys(seoPatch).length > 0) {
    await updateSeoSettings(seoPatch)
  }
  if (typeof data.siteName === 'string' || typeof data.siteLogoUrl === 'string') {
    const schemaPatch: Record<string, string> = {}
    if (typeof data.siteName === 'string') schemaPatch.organizationName = data.siteName
    if (typeof data.siteLogoUrl === 'string') schemaPatch.logoUrl = data.siteLogoUrl
    await updateSchemaSettings(schemaPatch)
  }

  cacheSet(KEY, updated, TTL_MS)
  return updated
}
