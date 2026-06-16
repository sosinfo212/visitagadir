import { loadSettings, saveSettings, clearSettings } from '../lib/storage.js'
import {
  fetchCategories,
  importListing,
  scrapeActiveTab,
  listPlacesOnActiveTab,
  startBatchImport,
  waitForBatchComplete,
  getBatchStatus,
} from '../lib/api-client.js'
import { uploadPlaceImages } from '../lib/image-uploader.js'

/** Must match EXTENSION_API_KEY in project .env for local dev */
const LOCAL_DEV_KEY = 'agadir-extension-api-key-change-in-production'

/** @type {import('../lib/types.js').ScrapedPlace | null} */
let scraped = null

/** @type {import('../lib/types.js').PlaceListItem[]} */
let listedPlaces = []

/** @type {number | null} */
let mapsTabId = null

const els = {
  apiBaseUrl: document.getElementById('apiBaseUrl'),
  extensionKey: document.getElementById('extensionKey'),
  showKey: document.getElementById('showKey'),
  pasteLocalKey: document.getElementById('pasteLocalKey'),
  localKeyHint: document.getElementById('localKeyHint'),
  defaultCategoryId: document.getElementById('defaultCategoryId'),
  saveSettings: document.getElementById('saveSettings'),
  loadCategories: document.getElementById('loadCategories'),
  resetSettings: document.getElementById('resetSettings'),
  listPlacesBtn: document.getElementById('listPlacesBtn'),
  placesPanel: document.getElementById('placesPanel'),
  selectAllPlaces: document.getElementById('selectAllPlaces'),
  placesCount: document.getElementById('placesCount'),
  placesList: document.getElementById('placesList'),
  batchImportBtn: document.getElementById('batchImportBtn'),
  scrapeBtn: document.getElementById('scrapeBtn'),
  importBtn: document.getElementById('importBtn'),
  status: document.getElementById('status'),
  preview: document.getElementById('preview'),
  pvName: document.getElementById('pv-name'),
  pvAddress: document.getElementById('pv-address'),
  pvPhone: document.getElementById('pv-phone'),
  pvRating: document.getElementById('pv-rating'),
  pvImages: document.getElementById('pv-images'),
  pvReviews: document.getElementById('pv-reviews'),
  batchResults: document.getElementById('batchResults'),
  batchResultsList: document.getElementById('batchResultsList'),
}

function setStatus(message, type = '') {
  els.status.textContent = message
  els.status.className = `status${type ? ` ${type}` : ''}`
}

function normalizeKeyInput(value) {
  return value
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\u200b/g, '')
}

function readFormConfig() {
  return {
    apiBaseUrl: els.apiBaseUrl.value.trim() || 'http://localhost:3000',
    extensionKey: normalizeKeyInput(els.extensionKey.value),
  }
}

function updateLocalHintVisibility() {
  const isLocal = els.apiBaseUrl.value.includes('localhost')
  els.localKeyHint.hidden = !isLocal
}

function renderPreview(data) {
  els.preview.hidden = false
  els.pvName.textContent = data.name || '—'
  els.pvAddress.textContent = data.address || '—'
  els.pvPhone.textContent = data.phone || '—'
  els.pvRating.textContent =
    data.rating != null
      ? `${data.rating} (${data.reviewCount ?? '?'} avis Google)`
      : '—'
  els.pvImages.textContent = String(data.imageUrls?.length ?? 0)
  els.pvReviews.textContent = String(data.reviews?.length ?? 0)
}

function getSelectedPlaces() {
  const checked = new Set(
    [...els.placesList.querySelectorAll('input[type="checkbox"]:checked')].map(
      (input) => input.value,
    ),
  )
  return listedPlaces.filter((place) => checked.has(place.id))
}

function updatePlacesSelectionUi() {
  const selected = getSelectedPlaces()
  els.placesCount.textContent = `${selected.length} / ${listedPlaces.length} sélectionné(s)`
  els.batchImportBtn.disabled = selected.length === 0
  els.selectAllPlaces.checked =
    listedPlaces.length > 0 && selected.length === listedPlaces.length
}

function renderPlacesList(places) {
  listedPlaces = places
  els.placesList.innerHTML = ''

  for (const place of places) {
    const li = document.createElement('li')
    li.className = 'place-item'

    const label = document.createElement('label')
    label.className = 'place-row'

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.value = place.id
    checkbox.checked = true
    checkbox.addEventListener('change', updatePlacesSelectionUi)

    const meta = document.createElement('span')
    meta.className = 'place-meta'

    const name = document.createElement('span')
    name.className = 'place-name'
    name.textContent = place.name

    const details = document.createElement('span')
    details.className = 'place-details'
    const parts = []
    if (place.rating != null) parts.push(`★ ${place.rating}`)
    if (place.address) parts.push(place.address)
    if (place.isCurrent) parts.push('(fiche ouverte)')
    details.textContent = parts.join(' · ')

    meta.append(name, details)
    label.append(checkbox, meta)
    li.append(label)
    els.placesList.append(li)
  }

  els.placesPanel.hidden = places.length === 0
  updatePlacesSelectionUi()
}

function renderBatchResults(progress) {
  els.batchResults.hidden = false
  els.batchResultsList.innerHTML = ''

  for (const item of progress.results || []) {
    const li = document.createElement('li')
    li.className = 'batch-ok'
    li.textContent = `✓ ${item.name} — ${item.reviewsCreated ?? 0} avis`
    if (item.url) {
      const link = document.createElement('a')
      link.href = item.url
      link.target = '_blank'
      link.rel = 'noopener'
      link.textContent = ' Ouvrir'
      li.append(link)
    }
    els.batchResultsList.append(li)
  }

  for (const item of progress.errors || []) {
    const li = document.createElement('li')
    li.className = 'batch-err'
    li.textContent = `✗ ${item.name} — ${item.error}`
    els.batchResultsList.append(li)
  }
}

function setBatchUiBusy(busy) {
  els.listPlacesBtn.disabled = busy
  els.batchImportBtn.disabled = busy || getSelectedPlaces().length === 0
  els.scrapeBtn.disabled = busy
  els.importBtn.disabled = busy || !scraped
}

async function initSettings() {
  const settings = await loadSettings()
  els.apiBaseUrl.value = settings.apiBaseUrl
  els.extensionKey.value = settings.extensionKey
  updateLocalHintVisibility()
}

async function loadCategoryOptions(selectedId = '') {
  const config = readFormConfig()
  if (!config.extensionKey) {
    setStatus('Saisissez la clé API, cliquez « Coller » ou « Enregistrer ».', 'error')
    return
  }

  setStatus('Chargement des catégories…')
  try {
    const categories = await fetchCategories(config)
    els.defaultCategoryId.innerHTML = '<option value="">— Choisir —</option>'
    for (const cat of categories) {
      const opt = document.createElement('option')
      opt.value = cat.id
      opt.textContent = cat.name
      if (cat.id === selectedId) opt.selected = true
      els.defaultCategoryId.appendChild(opt)
    }
    await saveSettings({
      ...config,
      defaultCategoryId: els.defaultCategoryId.value || selectedId,
    })
    setStatus(`${categories.length} catégories chargées`, 'success')
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Catégories indisponibles', 'error')
  }
}

els.showKey.addEventListener('change', () => {
  els.extensionKey.type = els.showKey.checked ? 'text' : 'password'
})

els.pasteLocalKey.addEventListener('click', () => {
  els.extensionKey.value = LOCAL_DEV_KEY
  els.showKey.checked = true
  els.extensionKey.type = 'text'
  setStatus('Clé locale collée — cliquez « Charger les catégories »', 'success')
})

els.apiBaseUrl.addEventListener('input', updateLocalHintVisibility)

els.saveSettings.addEventListener('click', async () => {
  const config = readFormConfig()
  await saveSettings({
    ...config,
    defaultCategoryId: els.defaultCategoryId.value,
  })
  setStatus('Paramètres enregistrés', 'success')
  await loadCategoryOptions(els.defaultCategoryId.value)
})

els.loadCategories.addEventListener('click', async () => {
  await loadCategoryOptions(els.defaultCategoryId.value)
})

els.resetSettings.addEventListener('click', async () => {
  await clearSettings()
  els.apiBaseUrl.value = 'http://localhost:3000'
  els.extensionKey.value = ''
  els.defaultCategoryId.innerHTML = '<option value="">— Charger les catégories —</option>'
  els.showKey.checked = false
  els.extensionKey.type = 'password'
  scraped = null
  listedPlaces = []
  mapsTabId = null
  els.preview.hidden = true
  els.placesPanel.hidden = true
  els.batchResults.hidden = true
  els.importBtn.disabled = true
  updateLocalHintVisibility()
  setStatus('Paramètres réinitialisés. Collez la clé locale puis rechargez les catégories.', 'success')
})

els.selectAllPlaces.addEventListener('change', () => {
  const checked = els.selectAllPlaces.checked
  for (const input of els.placesList.querySelectorAll('input[type="checkbox"]')) {
    input.checked = checked
  }
  updatePlacesSelectionUi()
})

els.listPlacesBtn.addEventListener('click', async () => {
  setStatus('Recherche des lieux sur la page…')
  els.listPlacesBtn.disabled = true
  try {
    const { tabId, places } = await listPlacesOnActiveTab()
    mapsTabId = tabId
    if (places.length === 0) {
      setStatus('Aucun lieu trouvé. Ouvrez une recherche Google Maps et faites défiler la liste.', 'error')
      els.placesPanel.hidden = true
      return
    }
    renderPlacesList(places)
    setStatus(`${places.length} lieu(x) trouvé(s). Cochez ceux à importer.`, 'success')
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Impossible de lister les lieux', 'error')
  } finally {
    els.listPlacesBtn.disabled = false
  }
})

els.batchImportBtn.addEventListener('click', async () => {
  const categoryId = els.defaultCategoryId.value
  if (!categoryId) {
    setStatus('Choisissez une catégorie par défaut.', 'error')
    return
  }

  const selected = getSelectedPlaces()
  if (selected.length === 0) {
    setStatus('Sélectionnez au moins un lieu.', 'error')
    return
  }

  if (mapsTabId == null) {
    setStatus('Relancez « Lister les lieux visibles ».', 'error')
    return
  }

  setBatchUiBusy(true)
  els.batchResults.hidden = true
  setStatus(`Import de ${selected.length} lieu(x)… Ne fermez pas l’onglet Maps.`)

  const keepAlivePort = chrome.runtime.connect({ name: 'batch-keepalive' })

  try {
    await startBatchImport(
      mapsTabId,
      selected,
      categoryId,
      readFormConfig(),
    )

    const progress = await waitForBatchComplete((p) => {
      if (p.current) {
        setStatus(`Import ${p.done + 1}/${p.total} — ${p.current}…`)
      }
    })

    renderBatchResults(progress)
    const ok = progress.results?.length ?? 0
    const fail = progress.errors?.length ?? 0
    setStatus(`Terminé : ${ok} importé(s), ${fail} erreur(s).`, fail ? 'error' : 'success')
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Import batch échoué', 'error')
  } finally {
    keepAlivePort.disconnect()
    setBatchUiBusy(false)
    updatePlacesSelectionUi()
  }
})

els.scrapeBtn.addEventListener('click', async () => {
  setStatus('Scan en cours…')
  els.importBtn.disabled = true
  try {
    scraped = await scrapeActiveTab()
    renderPreview(scraped)
    els.importBtn.disabled = false
    const reviewCount = scraped.reviews?.length ?? 0
    if (reviewCount === 0) {
      setStatus('Fiche scannée. Aucun avis capturé — ouvrez l’onglet Avis sur Maps puis rescannez.', 'error')
    } else {
      setStatus(`Fiche scannée : ${reviewCount} avis capturés. Vérifiez l’aperçu puis envoyez.`, 'success')
    }
  } catch (error) {
    scraped = null
    setStatus(error instanceof Error ? error.message : 'Erreur de scan', 'error')
  }
})

els.importBtn.addEventListener('click', async () => {
  if (!scraped) return
  const categoryId = els.defaultCategoryId.value
  if (!categoryId) {
    setStatus('Choisissez une catégorie par défaut.', 'error')
    return
  }

  setStatus('Envoi vers l’app…')
  els.importBtn.disabled = true
  try {
    const config = readFormConfig()
    const remotePhotos = scraped.imageUrls || []

    setStatus(`Téléchargement de ${remotePhotos.length} photo(s)…`)
    const uploadedImages = remotePhotos.length
      ? await uploadPlaceImages(remotePhotos, config)
      : []

    if (remotePhotos.length > 0 && uploadedImages.length === 0) {
      setStatus('Aucune photo téléchargée — vérifiez l’onglet Photos sur Maps puis rescannez.', 'error')
      els.importBtn.disabled = false
      return
    }

    setStatus(`Import en cours (${uploadedImages.length} photo(s))…`)

    const result = await importListing({
      name: scraped.name,
      description: scraped.description,
      address: scraped.address,
      categoryId,
      phone: scraped.phone || null,
      website: scraped.website || null,
      city: 'Agadir',
      country: 'MA',
      latitude: scraped.latitude ?? null,
      longitude: scraped.longitude ?? null,
      priceRange: scraped.priceRange || null,
      schemaType: 'Restaurant',
      openingHours: scraped.openingHours || null,
      googleMapsUrl: scraped.googleMapsUrl || null,
      googleRating: scraped.rating ?? null,
      googleReviewCount: scraped.reviewCount ?? null,
      images: uploadedImages,
      reviews: scraped.reviews || [],
      published: true,
      featured: false,
      metaDescription: scraped.description.replace(/<[^>]+>/g, '').slice(0, 160),
    }, config)

    setStatus(`Importé : ${result.url} (${result.reviewsCreated ?? 0} avis)`, 'success')
    scraped = null
    els.preview.hidden = true
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Import échoué', 'error')
    els.importBtn.disabled = false
  }
})

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== 'BATCH_PROGRESS' || !message.progress) return
  const { done, total, current } = message.progress
  if (current) {
    setStatus(`Import ${done + 1}/${total} — ${current}…`)
  }
})

async function restoreBatchStatus() {
  const status = await getBatchStatus()
  if (!status.running) {
    if (status.progress && (status.progress.results?.length || status.progress.errors?.length)) {
      renderBatchResults(status.progress)
      const ok = status.progress.results?.length ?? 0
      const fail = status.progress.errors?.length ?? 0
      setStatus(`Dernier import : ${ok} importé(s), ${fail} erreur(s).`, fail ? 'error' : 'success')
    }
    return
  }

  setBatchUiBusy(true)
  try {
    const progress = await waitForBatchComplete((p) => {
      if (p.current) {
        setStatus(`Import ${p.done + 1}/${p.total} — ${p.current}…`)
      }
    })
    renderBatchResults(progress)
    const ok = progress.results?.length ?? 0
    const fail = progress.errors?.length ?? 0
    setStatus(`Terminé : ${ok} importé(s), ${fail} erreur(s).`, fail ? 'error' : 'success')
  } catch {
    setStatus('Import interrompu — rouvrez la popup pour voir l’état.', 'error')
  } finally {
    setBatchUiBusy(false)
  }
}

initSettings()
restoreBatchStatus()
