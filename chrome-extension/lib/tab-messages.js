function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wait until a Maps tab finishes loading (handles race if already complete).
 * @param {number} tabId
 * @param {number} [timeoutMs]
 */
export function waitForTabReady(tabId, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    let settled = false

    const finish = () => {
      if (settled) return
      settled = true
      chrome.tabs.onUpdated.removeListener(onUpdated)
      clearTimeout(timer)
      // Maps hydrates the place panel after the document is "complete"
      setTimeout(resolve, 2800)
    }

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      chrome.tabs.onUpdated.removeListener(onUpdated)
      reject(new Error('Délai dépassé en chargeant la fiche Maps'))
    }, timeoutMs)

    function onUpdated(updatedId, info) {
      if (updatedId !== tabId || info.status !== 'complete') return
      finish()
    }

    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        clearTimeout(timer)
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      if (tab.status === 'complete') {
        finish()
      } else {
        chrome.tabs.onUpdated.addListener(onUpdated)
      }
    })
  })
}

/**
 * Send a message to a tab content script with retries (script may load after navigation).
 * @param {number} tabId
 * @param {object} message
 * @param {{ retries?: number; retryDelayMs?: number }} [options]
 */
export async function sendTabMessage(tabId, message, options = {}) {
  const retries = options.retries ?? 12
  const retryDelayMs = options.retryDelayMs ?? 600
  let lastError = 'Connexion au content script impossible'

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, message)
      return response
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError
      if (attempt < retries - 1) {
        await delay(retryDelayMs)
      }
    }
  }

  throw new Error(lastError)
}
