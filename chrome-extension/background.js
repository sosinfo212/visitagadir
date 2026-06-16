import { runBatchImport } from './lib/batch-import.js'

/** @type {{ running: boolean; progress: object | null }} */
const batchState = { running: false, progress: null }

chrome.runtime.onInstalled.addListener(() => {
  console.info('[Visit Agadir] Google Maps importer ready')
})

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'batch-keepalive') return
  port.onDisconnect.addListener(() => {})
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'BATCH_IMPORT') {
    if (batchState.running) {
      sendResponse({ ok: false, error: 'Un import est déjà en cours' })
      return false
    }

    batchState.running = true
    batchState.progress = {
      total: message.places?.length ?? 0,
      done: 0,
      current: '',
      results: [],
      errors: [],
    }

    // Respond immediately so the popup/service worker channel is not held open for minutes
    sendResponse({ ok: true, started: true })

    runBatchImport(
      message.tabId,
      message.places,
      message.config,
      message.categoryId,
      (progress) => {
        batchState.progress = progress
      },
    )
      .then((progress) => {
        batchState.running = false
        batchState.progress = progress
      })
      .catch((error) => {
        batchState.running = false
        batchState.progress = {
          ...batchState.progress,
          current: '',
          errors: [
            ...(batchState.progress?.errors || []),
            {
              name: 'Import batch',
              error: error instanceof Error ? error.message : 'Import batch échoué',
            },
          ],
        }
      })

    return false
  }

  if (message?.type === 'GET_BATCH_STATUS') {
    sendResponse({ ok: true, running: batchState.running, progress: batchState.progress })
    return false
  }

  return false
})
