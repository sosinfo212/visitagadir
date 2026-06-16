import { importScrapedPlace } from './import-one.js'
import { sendTabMessage, waitForTabReady } from './tab-messages.js'

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeMapsUrl(raw) {
  try {
    const url = new URL(raw, 'https://www.google.com')
    if (!url.hostname.includes('google.') || !url.pathname.includes('/maps')) {
      return raw
    }
    return url.href
  } catch {
    return raw
  }
}

async function scrapeTab(tabId) {
  const response = await sendTabMessage(tabId, { type: 'SCRAPE_PLACE' }, { retries: 15, retryDelayMs: 800 })
  if (!response?.ok) {
    throw new Error(response?.error || 'Échec du scan')
  }
  return response.data
}

/**
 * @param {number} tabId
 * @param {Array<{ name: string; mapsUrl: string }>} places
 * @param {{ apiBaseUrl: string; extensionKey: string }} config
 * @param {string} categoryId
 * @param {(progress: object) => void} [onProgress]
 */
export async function runBatchImport(tabId, places, config, categoryId, onProgress) {
  const progress = {
    total: places.length,
    done: 0,
    current: '',
    results: [],
    errors: [],
  }

  const report = () => {
    if (onProgress) onProgress({ ...progress })
    chrome.runtime.sendMessage({ type: 'BATCH_PROGRESS', progress: { ...progress } }).catch(() => {})
  }

  report()

  const keepAlive = setInterval(() => {
    chrome.runtime.getPlatformInfo(() => {})
  }, 20_000)

  try {
    for (const place of places) {
      progress.current = place.name
      report()

      try {
        const targetUrl = normalizeMapsUrl(place.mapsUrl)
        await chrome.tabs.update(tabId, { url: targetUrl })
        await waitForTabReady(tabId)
        await delay(500)

        const scraped = await scrapeTab(tabId)
        const result = await importScrapedPlace(scraped, categoryId, config, {
          allowMissingPhotos: true,
        })
        progress.results.push({
          name: place.name,
          url: result.url,
          reviewsCreated: result.reviewsCreated ?? 0,
        })
      } catch (error) {
        progress.errors.push({
          name: place.name,
          error: error instanceof Error ? error.message : 'Import échoué',
        })
      }

      progress.done += 1
      report()
    }
  } finally {
    clearInterval(keepAlive)
  }

  progress.current = ''
  report()
  return progress
}
