import { loadSettings } from '../lib/storage.js'
import { sendTabMessage } from './tab-messages.js'

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
    throw new Error('Ouvrez d’abord Google Maps (recherche ou fiche lieu)')
  }

  const response = await sendTabMessage(tab.id, { type: 'SCRAPE_PLACE' })
  if (!response?.ok) {
    throw new Error(response?.error || 'Échec du scraping')
  }
  return response.data
}

/**
 * @returns {Promise<{ tabId: number; places: import('../lib/types.js').PlaceListItem[] }>}
 */
export async function listPlacesOnActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) throw new Error('Aucun onglet actif')
  if (!tab.url?.includes('google.com/maps')) {
    throw new Error('Ouvrez d’abord Google Maps avec une liste de résultats')
  }

  const response = await sendTabMessage(tab.id, { type: 'LIST_PLACES' })
  if (!response?.ok) {
    throw new Error(response?.error || 'Impossible de lister les lieux')
  }
  return { tabId: tab.id, places: response.data || [] }
}

/**
 * @param {number} tabId
 * @param {import('../lib/types.js').PlaceListItem[]} places
 * @param {string} categoryId
 * @param {ApiConfig | null} configOverride
 */
export function startBatchImport(tabId, places, categoryId, configOverride = null) {
  return resolveConfig(configOverride).then(
    (config) =>
      new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: 'BATCH_IMPORT',
            tabId,
            places,
            categoryId,
            config,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
              return
            }
            if (!response?.ok) {
              reject(new Error(response?.error || 'Import batch échoué'))
              return
            }
            resolve(response)
          },
        )
      }),
  )
}

/**
 * Poll until the background batch import finishes.
 * @param {(progress: object) => void} [onProgress]
 */
export function waitForBatchComplete(onProgress) {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await getBatchStatus()
        if (status.progress && onProgress) onProgress(status.progress)
        if (status.running) {
          setTimeout(poll, 500)
          return
        }
        if (status.progress) {
          resolve(status.progress)
          return
        }
        reject(new Error('Import interrompu'))
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Import interrompu'))
      }
    }
    poll()
  })
}

/** @returns {Promise<{ running: boolean; progress: object | null }>} */
export function getBatchStatus() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_BATCH_STATUS' }, (response) => {
      resolve({
        running: Boolean(response?.running),
        progress: response?.progress ?? null,
      })
    })
  })
}
