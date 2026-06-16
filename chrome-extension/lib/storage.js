/** @typedef {import('./types.js').ScrapedPlace} ScrapedPlace */

const DEFAULTS = {
  apiBaseUrl: 'http://localhost:3000',
  extensionKey: '',
  defaultCategoryId: '',
}

/** @returns {Promise<{ apiBaseUrl: string; extensionKey: string; defaultCategoryId: string }>} */
export async function loadSettings() {
  const data = await chrome.storage.sync.get(Object.keys(DEFAULTS))
  return { ...DEFAULTS, ...data }
}

/** @param {Partial<typeof DEFAULTS>} patch */
export async function saveSettings(patch) {
  await chrome.storage.sync.set(patch)
}

export async function clearSettings() {
  await chrome.storage.sync.clear()
}
