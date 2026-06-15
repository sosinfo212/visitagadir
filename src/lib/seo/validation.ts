/**
 * Validation helpers for SEO settings and structured-data inputs.
 * Keeps bad data out of the DB and gives the admin UI actionable errors.
 */

import { safeSchemaType } from './types'

export interface ValidationResult {
  ok: boolean
  errors: string[]
}

export function validateUrl(value: string, field: string, required = false): string | null {
  const t = value.trim()
  if (!t) return required ? `${field} is required` : null
  if (t.startsWith('/')) return null
  try {
    const u = new URL(t)
    if (!['http:', 'https:'].includes(u.protocol)) return `${field} must be http or https`
    return null
  } catch {
    return `${field} must be a valid URL or path starting with /`
  }
}

export function validateRobots(value: string): string | null {
  const t = value.trim()
  if (!t) return 'Robots directive is required'
  const allowed = /^(index|noindex),(follow|nofollow)$/i
  if (!allowed.test(t)) return 'Robots must look like index,follow or noindex,nofollow'
  return null
}

export function validateSeoSettingsPatch(patch: Record<string, string | null>): ValidationResult {
  const errors: string[] = []

  if (patch.siteUrl !== undefined) {
    const e = validateUrl(patch.siteUrl ?? '', 'Site URL', true)
    if (e) errors.push(e)
  }
  if (patch.canonicalDomain !== undefined) {
    const e = validateUrl(patch.canonicalDomain ?? '', 'Canonical domain', true)
    if (e) errors.push(e)
  }
  if (patch.defaultRobots !== undefined && patch.defaultRobots) {
    const e = validateRobots(patch.defaultRobots)
    if (e) errors.push(e)
  }
  if (patch.titleTemplate !== undefined && patch.titleTemplate && !patch.titleTemplate.includes('%s')) {
    errors.push('Title template should contain %s for the page title placeholder')
  }
  if (patch.defaultDescription !== undefined && patch.defaultDescription && patch.defaultDescription.length > 320) {
    errors.push('Default meta description should be under 320 characters')
  }

  return { ok: errors.length === 0, errors }
}

export function validateSchemaSettingsPatch(patch: Record<string, string | null>): ValidationResult {
  const errors: string[] = []

  if (patch.websiteUrl !== undefined) {
    const e = validateUrl(patch.websiteUrl ?? '', 'Website URL', true)
    if (e) errors.push(e)
  }
  if (patch.searchUrlPattern !== undefined) {
    const t = (patch.searchUrlPattern ?? '').trim()
    if (!t) errors.push('Search URL pattern is required')
    else if (!t.includes('{search_term_string}')) {
      errors.push('Search URL pattern must include {search_term_string}')
    }
  }
  if (patch.organizationType !== undefined && patch.organizationType) {
    const safe = safeSchemaType(patch.organizationType, '')
    if (!safe) errors.push('Organization type is invalid')
  }
  if (patch.country !== undefined && patch.country) {
    if (!/^[A-Z]{2}$/i.test(patch.country.trim())) {
      errors.push('Country must be a 2-letter ISO code (e.g. MA)')
    }
  }

  return { ok: errors.length === 0, errors }
}

export function validateRedirectInput(source: string, destination: string): ValidationResult {
  const errors: string[] = []
  const s = source.trim()
  const d = destination.trim()
  if (!s) errors.push('Source path is required')
  if (!d) errors.push('Destination is required')
  if (s && !s.startsWith('/') && !/^https?:\/\//i.test(s)) {
    errors.push('Source must be a path (/) or absolute URL')
  }
  if (d && !d.startsWith('/') && !/^https?:\/\//i.test(d)) {
    errors.push('Destination must be a path (/) or absolute URL')
  }
  return { ok: errors.length === 0, errors }
}

export function validateSocialProfiles(
  profiles: Array<{ platform?: string; url?: string; enabled?: boolean }>,
): ValidationResult {
  const errors: string[] = []
  for (let i = 0; i < profiles.length; i++) {
    const p = profiles[i]
    if (!p.platform) errors.push(`Profile ${i + 1}: platform is required`)
    if (p.enabled !== false && p.url) {
      const e = validateUrl(p.url, `Profile ${i + 1} URL`, true)
      if (e) errors.push(e)
    }
  }
  return { ok: errors.length === 0, errors }
}
