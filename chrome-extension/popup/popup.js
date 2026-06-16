import { loadSettings, saveSettings, clearSettings } from '../lib/storage.js'
import { fetchCategories, importListing, scrapeActiveTab } from '../lib/api-client.js'
import { uploadPlaceImages } from '../lib/image-uploader.js'

/** Must match EXTENSION_API_KEY in project .env for local dev */
const LOCAL_DEV_KEY = 'agadir-extension-api-key-change-in-production'

/** @type {import('../lib/types.js').ScrapedPlace | null} */
let scraped = null

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

async function initSettings() {
  const settings = await loadSettings()
  els.apiBaseUrl.value = settings.apiBaseUrl
  els.extensionKey.value = settings.extensionKey
  updateLocalHintVisibility()
  // Do not auto-fetch categories — stale chrome.storage keys caused 401 on open
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
  els.preview.hidden = true
  els.importBtn.disabled = true
  updateLocalHintVisibility()
  setStatus('Paramètres réinitialisés. Collez la clé locale puis rechargez les catégories.', 'success')
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

initSettings()
