import { loadSettings } from '../lib/storage.js'

const KEY_HEADER = 'X-Extension-Key'

/**
 * @typedef {{ apiBaseUrl?: string; extensionKey?: string }} ApiConfig
 */

/**
 * @param {ApiConfig | null | undefined} override
 */
async function resolveConfig(override) {
  const stored = await loadSettings()
  const apiBaseUrl = (override?.apiBaseUrl || stored.apiBaseUrl || 'http://localhost:3000').replace(/\/$/, '')
  const extensionKey = (override?.extensionKey ?? stored.extensionKey ?? '').trim()
  return { apiBaseUrl, extensionKey }
}

/**
 * @param {string} path
 * @param {RequestInit} [init]
 * @param {ApiConfig | null} [configOverride]
 */
async function apiFetch(path, init = {}, configOverride = null) {
  const { apiBaseUrl, extensionKey } = await resolveConfig(configOverride)
  if (!extensionKey) {
    throw new Error('Clé API manquante. Saisissez-la ci-dessus puis cliquez « Enregistrer ».')
  }

  const headers = new Headers(init.headers || {})
  headers.set('Content-Type', 'application/json')
  headers.set(KEY_HEADER, extensionKey)

  let res
  try {
    res = await fetch(`${apiBaseUrl}${path}`, { ...init, headers })
  } catch {
    throw new Error(`Impossible de joindre ${apiBaseUrl}. Vérifiez que l’app tourne et l’URL est correcte.`)
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(
        'Clé API refusée. La valeur doit être identique à EXTENSION_API_KEY dans .env — redémarrez npm run dev après toute modification.',
      )
    }
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return data
}

/** @param {ApiConfig | null} [configOverride] */
export async function fetchCategories(configOverride = null) {
  return apiFetch('/api/extension/categories', {}, configOverride)
}

/**
 * @param {Record<string, unknown>} payload
 * @param {ApiConfig | null} [configOverride]
 */
export async function importListing(payload, configOverride = null) {
  return apiFetch('/api/extension/import', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, configOverride)
}

/**
 * @returns {Promise<import('../lib/types.js').ScrapedPlace>}
 */
export async function scrapeActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) throw new Error('Aucun onglet actif')
  if (!tab.url?.includes('google.com/maps')) {
    throw new Error('Ouvrez d’abord une fiche Google Maps')
  }

  const response = await chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PLACE' })
  if (!response?.ok) {
    throw new Error(response?.error || 'Échec du scraping')
  }
  return response.data
}
