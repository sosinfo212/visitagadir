/**
 * Google Maps place scraper (content script).
 * Best-effort extraction — Google DOM changes often; re-test after Maps updates.
 */

const DAY_MAP = {
  lundi: 'Monday',
  monday: 'Monday',
  mardi: 'Tuesday',
  tuesday: 'Tuesday',
  mercredi: 'Wednesday',
  wednesday: 'Wednesday',
  jeudi: 'Thursday',
  thursday: 'Thursday',
  vendredi: 'Friday',
  friday: 'Friday',
  samedi: 'Saturday',
  saturday: 'Saturday',
  dimanche: 'Sunday',
  sunday: 'Sunday',
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function text(el) {
  return (el?.textContent || '').replace(/\s+/g, ' ').trim()
}

function pickFirst(selectors, root = document) {
  for (const sel of selectors) {
    const el = root.querySelector(sel)
    if (el && text(el)) return text(el)
  }
  return ''
}

function parseRatingLabel(raw) {
  const m = raw.match(/(\d+[.,]\d+|\d+)/)
  return m ? Number(m[1].replace(',', '.')) : null
}

function parseReviewCount(raw) {
  const m = raw.replace(/,/g, '').match(/(\d[\d\s]*)\s*(?:avis|reviews|review|ratings?)/i)
    || raw.replace(/,/g, '').match(/\((\d[\d\s]*)\)/)
  if (!m) return null
  return Number(m[1].replace(/\s/g, ''))
}

function extractPlaceIdFromUrl(url) {
  try {
    const u = new URL(url)
    const q = u.searchParams.get('query_place_id')
    if (q) return q
    const m = u.pathname.match(/\/place\/[^/]+\/data=![^!]*!1s([^!]+)/)
    if (m) return decodeURIComponent(m[1])
    const hash = u.hash || u.pathname
    const idMatch = hash.match(/!(?:1s|0x)[0-9a-fx:]+/i)
    return idMatch ? idMatch[0] : null
  } catch {
    return null
  }
}

function extractCoordsFromUrl(url) {
  const m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (!m) return { latitude: null, longitude: null }
  return { latitude: Number(m[1]), longitude: Number(m[2]) }
}

function extractJsonLd() {
  for (const node of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const data = JSON.parse(node.textContent || '')
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        if (item && (item['@type'] === 'LocalBusiness' || item['@type'] === 'Restaurant' || item['@type'] === 'FoodEstablishment')) {
          return item
        }
      }
    } catch {
      /* ignore */
    }
  }
  return null
}

function extractPhone() {
  const tel = document.querySelector('a[href^="tel:"]')
  if (tel) return tel.getAttribute('href')?.replace('tel:', '').trim() || text(tel)
  return pickFirst(['button[data-item-id="phone"]', '[data-tooltip="Copy phone number"]'])
}

function extractWebsite() {
  const a = document.querySelector('a[data-item-id="authority"], a[aria-label*="Website" i], a[aria-label*="Site web" i]')
  if (a?.href && !a.href.includes('google.com')) return a.href
  return ''
}

function extractAddress() {
  const btn = document.querySelector('button[data-item-id="address"]')
  if (btn) return text(btn)
  const jsonLd = extractJsonLd()
  if (jsonLd?.address) {
    if (typeof jsonLd.address === 'string') return jsonLd.address
    const a = jsonLd.address
    return [a.streetAddress, a.postalCode, a.addressLocality, a.addressCountry].filter(Boolean).join(', ')
  }
  return pickFirst(['[data-item-id="address"]', 'button[aria-label*="Address" i]'])
}

function extractHoursRows() {
  const rows = []
  const table = document.querySelector('table.eK4R0e, table.WgFkxc, div[aria-label*="Hours" i] table')
  if (!table) return rows

  for (const tr of table.querySelectorAll('tr')) {
    const cells = [...tr.querySelectorAll('td, th')].map(text)
    if (cells.length < 2) continue
    const dayRaw = cells[0].toLowerCase()
    const day = DAY_MAP[dayRaw.split(/\s/)[0]] || DAY_MAP[dayRaw] || cells[0]
    const hoursRaw = cells[1]
    const parts = hoursRaw.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/)
    if (parts) {
      rows.push({ dayOfWeek: [day], opens: parts[1], closes: parts[2] })
    }
  }
  return rows
}

function extractNameFromUrl(url) {
  try {
    const match = new URL(url).pathname.match(/\/maps\/place\/([^/@]+)/)
    if (!match) return ''
    return decodeURIComponent(match[1].replace(/\+/g, ' ')).trim()
  } catch {
    return ''
  }
}

const GENERIC_NAME_PATTERNS = [
  /^results?$/i,
  /^r[eé]sultats?$/i,
  /^google maps$/i,
  /^agadir\s+(restaurant|hotel|café|cafe|shop|store|plage|beach)s?$/i,
  /^restaurants?\s+(à|a|in|near)\s+agadir$/i,
]

function extractNameFromSelectedPlace() {
  const activeSelectors = [
    '[role="feed"] [aria-current="true"] .qBF1Pd',
    '[role="feed"] .Nv2PK.TCHLgd .qBF1Pd',
    '[role="feed"] .Nv2PK.q78x0b .qBF1Pd',
    '[role="feed"] .Nv2PK:focus-within .qBF1Pd',
  ]
  for (const sel of activeSelectors) {
    const el = document.querySelector(sel)
    const name = text(el)
    if (name && !isGenericPlaceName(name)) return name
  }

  for (const link of document.querySelectorAll('a.hfpxzc[aria-label]')) {
    const label = link.getAttribute('aria-label') || ''
    const name = label.split('·')[0].split(',')[0].trim()
    if (name && !isGenericPlaceName(name)) return name
  }

  return ''
}

function extractNameFromPlaceHeader() {
  const panel = getPlacePanelRoot()
  return pickFirst(
    [
      'h1.DUwDvf',
      'h1.fontHeadlineLarge',
      'h1.qrShPb',
      '[data-attrid="title"]',
      'button[data-item-id="title"]',
    ],
    panel,
  )
}

function isGenericPlaceName(name) {
  if (!name || name.length < 2) return true
  return GENERIC_NAME_PATTERNS.some((re) => re.test(name.trim()))
}

function getPlaceDetailRoot() {
  const title = document.querySelector('h1.DUwDvf, h1.fontHeadlineLarge, h1.qrShPb')
  if (!title || isGenericPlaceName(text(title))) return null

  return (
    title.closest('.m6QErb.Dxybcbx') ||
    title.closest('.m6QErb') ||
    title.closest('[role="region"]')
  )
}

/** @deprecated use getPlaceDetailRoot for place-specific scraping */
function getPlacePanelRoot() {
  return getPlaceDetailRoot() || document.querySelector('[role="main"]') || document
}

function isInsideExcludedRegion(el) {
  if (!el) return true
  return Boolean(
    el.closest('[role="feed"]') ||
      el.closest('.Nv2PK') ||
      el.closest('a.hfpxzc') ||
      el.closest('.section-result'),
  )
}

function isLikelyPlacePhoto(url) {
  if (!url?.includes('googleusercontent.com')) return false
  if (url.includes('/a-/') || url.includes('/a/ACg8oc')) return false
  return (
    url.includes('/gps-cs-s/') ||
    url.includes('/gpms-cs-s/') ||
    url.includes('/p/') ||
    url.includes('/places/') ||
    /=w\d+-h\d+/.test(url)
  )
}

function addPhotoUrl(urls, src, { requirePlacePath = true } = {}) {
  const normalized = normalizePhotoUrl(src)
  if (!normalized) return
  if (requirePlacePath && !isLikelyPlacePhoto(normalized)) return
  urls.add(normalized)
}

function addPhotoFromElement(urls, el, options) {
  if (isInsideExcludedRegion(el)) return
  addPhotoUrl(urls, el.getAttribute('src') || el.getAttribute('data-src'), options)
}

function extractPhotosFromButtons(root, urls, options) {
  if (!root) return
  for (const btn of root.querySelectorAll('button[jsaction*="photo"], button[data-photo-index]')) {
    if (isInsideExcludedRegion(btn)) continue
    const img = btn.querySelector('img')
    if (img) addPhotoFromElement(urls, img, options)

    const style = btn.getAttribute('style') || ''
    const match = style.match(/url\(["']?(https:\/\/[^"')]+googleusercontent[^"')]+)/i)
    if (match) addPhotoUrl(urls, match[1], options)
  }
}

function extractOverviewPhotos(detailRoot) {
  const urls = new Set()
  extractPhotosFromButtons(detailRoot, urls, { requirePlacePath: true })
  return urls
}

function extractPhotosTabPhotos(detailRoot) {
  const urls = new Set()
  const placeName = extractNameFromPlaceHeader()

  for (const region of document.querySelectorAll('[aria-label][role="region"], [aria-label]')) {
    const label = region.getAttribute('aria-label') || ''
    const labelLower = label.toLowerCase()
    const isPhotoRegion =
      labelLower.includes('photos of') ||
      labelLower.includes('photos de') ||
      labelLower.includes('photo de') ||
      labelLower.includes('photos du')
    if (!isPhotoRegion) continue
    if (placeName && !labelLower.includes(placeName.toLowerCase().slice(0, 8))) continue
    if (isInsideExcludedRegion(region)) continue
    extractPhotosFromButtons(region, urls, { requirePlacePath: true })
  }

  if (detailRoot) {
    extractPhotosFromButtons(detailRoot, urls, { requirePlacePath: true })
    for (const img of detailRoot.querySelectorAll('img[src*="googleusercontent.com"]')) {
      addPhotoFromElement(urls, img, { requirePlacePath: true })
    }
  }

  return urls
}

function extractPlacePhotos(detailRoot = getPlaceDetailRoot()) {
  const urls = new Set()

  for (const u of extractOverviewPhotos(detailRoot)) urls.add(u)
  for (const u of extractPhotosTabPhotos(detailRoot)) urls.add(u)

  const jsonLd = extractJsonLd()
  if (jsonLd?.image) {
    const imgs = Array.isArray(jsonLd.image) ? jsonLd.image : [jsonLd.image]
    for (const u of imgs) {
      addPhotoUrl(urls, typeof u === 'string' ? u : u?.url, { requirePlacePath: false })
    }
  }

  return [...urls].slice(0, 12)
}

function extractName() {
  const jsonLd = extractJsonLd()
  const urlName = extractNameFromUrl(location.href)
  const candidates = [
    urlName,
    jsonLd?.name,
    extractNameFromPlaceHeader(),
    extractNameFromSelectedPlace(),
    document.title.replace(/\s*[-–—]\s*Google Maps.*/i, '').trim(),
  ].filter(Boolean)

  for (const raw of candidates) {
    const name = String(raw).trim()
    if (name.length >= 2 && name.length <= 120 && !isGenericPlaceName(name)) {
      return name
    }
  }

  throw new Error(
    'Impossible de lire le nom du lieu. Cliquez sur le restaurant dans la liste pour ouvrir sa fiche, puis rescannez.',
  )
}

function normalizePhotoUrl(src) {
  if (!src?.startsWith('http')) return null
  if (src.includes('/a-/') || src.includes('/a/ACg8oc')) return null
  if (/=s(16|20|24|32|40|48|56|64|96)-/.test(src)) return null
  if (src.includes('=s32') || src.includes('=s40') || src.includes('=s64')) return null

  let url = src.split('?')[0]
  url = url.replace(/=w\d+-h\d+-k-no/, '=w1200-h800-k-no')
  if (!/=w\d+-h\d+/.test(url) && url.includes('googleusercontent.com')) {
    url += (url.includes('=') ? '' : '=') + 'w1200-h800-k-no'
  }
  return url
}

function extractImages() {
  return extractPlacePhotos()
}

async function ensurePhotosTabOpen(detailRoot) {
  const scope = detailRoot || getPlaceDetailRoot() || document

  for (const btn of scope.querySelectorAll('button[role="tab"]')) {
    const label = (btn.getAttribute('aria-label') || btn.textContent || '').toLowerCase()
    if (!label.includes('photo')) continue
    if (btn.getAttribute('aria-selected') === 'true') return
    btn.click()
    await delay(1000)
    return
  }
}

async function scrollPhotosPanel(detailRoot) {
  const panels = []
  if (detailRoot) panels.push(detailRoot)

  for (const region of document.querySelectorAll('[aria-label][role="region"]')) {
    const label = (region.getAttribute('aria-label') || '').toLowerCase()
    if (label.includes('photos of') || label.includes('photos de') || label.includes('photo de')) {
      if (!isInsideExcludedRegion(region)) panels.push(region)
    }
  }

  for (const panel of panels) {
    if (panel.querySelector('.Nv2PK')) continue
    for (let i = 0; i < 3; i += 1) {
      panel.scrollTop += 400
      await delay(200)
    }
  }
}

function findAuthorInCard(card) {
  const selectors = [
    '.d4r55',
    '.WNxzHc',
    'button.WEBjve',
    '.uaQIsf',
    'a[href*="/contrib/"]',
    'div[class*="d4r55"]',
  ]
  for (const sel of selectors) {
    const el = card.querySelector(sel)
    const name = text(el)
    if (name && name.length >= 2 && name.length <= 80) return name
  }
  return ''
}

function findRatingInCard(card) {
  const starsEl = card.querySelector(
    'span[role="img"][aria-label*="star" i], span[role="img"][aria-label*="étoile" i], span[role="img"][aria-label*="stars" i]',
  )
  if (starsEl) {
    const parsed = parseRatingLabel(starsEl.getAttribute('aria-label') || '')
    if (parsed) return Math.min(5, Math.max(1, Math.round(parsed)))
  }
  return 5
}

function findCommentInCard(card) {
  const selectors = [
    '.wiI7pd',
    '.MyEned span',
    '.MyEned',
    'span[data-expandable-section]',
    '.review-full-text',
    'div[class*="wiI7pd"]',
  ]
  for (const sel of selectors) {
    const el = card.querySelector(sel)
    const comment = text(el)
    if (comment.length >= 10) return comment
  }
  return ''
}

function pushReview(reviews, seen, authorName, rating, comment) {
  const cleanAuthor = authorName?.trim().slice(0, 80)
  const cleanComment = comment?.trim().slice(0, 2000)
  if (!cleanAuthor || !cleanComment || cleanComment.length < 10) return
  const key = `${cleanAuthor}::${cleanComment.slice(0, 120)}`
  if (seen.has(key)) return
  seen.add(key)
  reviews.push({
    authorName: cleanAuthor,
    rating: rating ?? 5,
    comment: cleanComment,
  })
}

function extractReviewsFromJsonLd(jsonLd, reviews, seen) {
  if (!jsonLd?.review) return
  const items = Array.isArray(jsonLd.review) ? jsonLd.review : [jsonLd.review]
  for (const item of items) {
    const authorName = item.author?.name || item.author || 'Google User'
    const rating = item.reviewRating?.ratingValue
      ? Math.min(5, Math.max(1, Math.round(Number(item.reviewRating.ratingValue))))
      : 5
    const comment = item.reviewBody || item.description || ''
    pushReview(reviews, seen, String(authorName), rating, String(comment))
  }
}

function extractReviewsFromDom(reviews, seen) {
  const cardSelectors = [
    '[data-review-id]',
    'div.jftiEf',
    'div.jftiEf.fontBodyMedium',
    'div[role="listitem"]',
    'div[jsaction*="review"]',
  ]

  const cards = new Set()
  for (const sel of cardSelectors) {
    for (const el of document.querySelectorAll(sel)) {
      if (el.querySelector('.wiI7pd, .MyEned, span[data-expandable-section]')) {
        cards.add(el)
      }
    }
  }

  for (const card of cards) {
    pushReview(
      reviews,
      seen,
      findAuthorInCard(card),
      findRatingInCard(card),
      findCommentInCard(card),
    )
    if (reviews.length >= 15) return
  }
}

function extractReviewsFromTextSpans(reviews, seen) {
  for (const span of document.querySelectorAll('.wiI7pd, span[class*="wiI7pd"]')) {
    const comment = text(span)
    if (comment.length < 10) continue

    let authorName = ''
    let rating = 5
    let node = span.parentElement
    for (let depth = 0; depth < 8 && node; depth += 1) {
      if (!authorName) authorName = findAuthorInCard(node)
      if (rating === 5) rating = findRatingInCard(node)
      node = node.parentElement
    }

    pushReview(reviews, seen, authorName || 'Google User', rating, comment)
    if (reviews.length >= 15) return
  }
}

function extractReviewsFromScripts(reviews, seen) {
  for (const script of document.querySelectorAll('script:not([src])')) {
    const raw = script.textContent || ''
    if (raw.length < 500 || !raw.includes('review')) continue

    // Embedded review bodies often appear as escaped JSON strings near author metadata
    for (const match of raw.matchAll(/"([^"]{20,500})"/g)) {
      const candidate = match[1]
        .replace(/\\n/g, ' ')
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      if (
        candidate.length >= 25 &&
        /[a-zA-Z]{4,}/.test(candidate) &&
        !candidate.startsWith('http') &&
        !candidate.includes('googleusercontent') &&
        !candidate.includes('function') &&
        !candidate.includes('prototype')
      ) {
        // Only use if it looks like natural language review text
        const wordCount = candidate.split(/\s+/).length
        if (wordCount >= 5 && wordCount <= 80) {
          pushReview(reviews, seen, 'Google User', 5, candidate)
        }
      }
      if (reviews.length >= 15) return
    }
  }
}

function extractReviews(jsonLd) {
  const reviews = []
  const seen = new Set()

  extractReviewsFromJsonLd(jsonLd, reviews, seen)
  extractReviewsFromDom(reviews, seen)
  extractReviewsFromTextSpans(reviews, seen)

  // Script parsing is noisy — only if still empty
  if (reviews.length === 0) {
    extractReviewsFromScripts(reviews, seen)
  }

  return reviews.slice(0, 15)
}

async function ensureReviewsTabOpen(detailRoot) {
  const scope = detailRoot || getPlaceDetailRoot() || document

  for (const btn of scope.querySelectorAll('button[role="tab"]')) {
    const label = (btn.getAttribute('aria-label') || btn.textContent || '').toLowerCase()
    if (!label.includes('review') && !label.includes('avis')) continue
    if (btn.getAttribute('aria-selected') === 'true') return
    btn.click()
    await delay(1200)
    return
  }

  const more = scope.querySelector(
    'button[aria-label*="More reviews" i], button[aria-label*="Plus d\'avis" i]',
  )
  if (more) {
    more.click()
    await delay(800)
  }
}

async function scrollReviewPanel(detailRoot) {
  const panels = []
  if (detailRoot) panels.push(detailRoot)

  for (const region of document.querySelectorAll('[aria-label][role="region"]')) {
    const label = (region.getAttribute('aria-label') || '').toLowerCase()
    if (
      label.includes('reviews for') ||
      label.includes('avis sur') ||
      label.includes('avis pour')
    ) {
      if (!isInsideExcludedRegion(region)) panels.push(region)
    }
  }

  for (const panel of panels) {
    if (panel.querySelector('.Nv2PK')) continue
    for (let i = 0; i < 4; i += 1) {
      panel.scrollTop += 500
      await delay(250)
    }
  }
}

function buildDescription(name, jsonLd) {
  const bits = []
  if (jsonLd?.description) bits.push(jsonLd.description)
  if (jsonLd?.servesCuisine) {
    const c = Array.isArray(jsonLd.servesCuisine) ? jsonLd.servesCuisine.join(', ') : jsonLd.servesCuisine
    bits.push(`Cuisine : ${c}.`)
  }
  if (!bits.length) {
    bits.push(`Discover ${name} — a local spot worth visiting in Agadir.`)
  }
  return `<p>${bits.join(' ').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
}

function scrapePlace() {
  const sourceUrl = location.href
  const jsonLd = extractJsonLd()
  const coords = extractCoordsFromUrl(sourceUrl)
  const placeId = extractPlaceIdFromUrl(sourceUrl)

  const name = extractName()

  const ratingLabel = pickFirst(['div.F7nice span[aria-hidden="true"]', 'span.ceNzKf'])
  const rating =
    jsonLd?.aggregateRating?.ratingValue != null
      ? Number(jsonLd.aggregateRating.ratingValue)
      : parseRatingLabel(document.querySelector('[role="img"][aria-label*="stars" i]')?.getAttribute('aria-label') || ratingLabel || '')

  const reviewCount =
    jsonLd?.aggregateRating?.reviewCount != null
      ? Number(jsonLd.aggregateRating.reviewCount)
      : parseReviewCount(
          text(document.querySelector('button[jsaction*="reviews"]')) ||
            text(document.querySelector('span[aria-label*="reviews" i]')),
        )

  const address = extractAddress()
  const phone = extractPhone()
  const website = extractWebsite() || jsonLd?.url || ''
  const openingHours = extractHoursRows()
  const imageUrls = extractImages()
  const reviews = extractReviews(jsonLd)

  let googleMapsUrl = sourceUrl.split('?')[0]
  if (placeId) {
    googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`
  }

  let priceRange = null
  const priceRaw = text(document.querySelector('span[aria-label*="Price" i], span[aria-label*="Prix" i]'))
  if (priceRaw.includes('€€€€')) priceRange = '$$$$'
  else if (priceRaw.includes('€€€')) priceRange = '$$$'
  else if (priceRaw.includes('€€')) priceRange = '$$'
  else if (priceRaw.includes('€')) priceRange = '$'

  return {
    name,
    description: buildDescription(name, jsonLd),
    address: address || 'Agadir, Morocco',
    phone: phone || undefined,
    website: website || undefined,
    latitude: coords.latitude ?? undefined,
    longitude: coords.longitude ?? undefined,
    rating: rating ?? undefined,
    reviewCount: reviewCount ?? undefined,
    priceRange: priceRange || undefined,
    googleMapsUrl,
    placeId: placeId || undefined,
    openingHours: openingHours.length ? openingHours : undefined,
    imageUrls,
    reviews,
    scrapedAt: new Date().toISOString(),
    sourceUrl,
  }
}

async function scrapePlaceAsync() {
  await delay(400)

  let detailRoot = getPlaceDetailRoot()
  if (!detailRoot) {
    detailRoot = await waitForDetailRoot(15000)
  }
  if (!detailRoot) {
    throw new Error(
      'Ouvrez la fiche détaillée du lieu (cliquez sur le commerce dans la liste), puis rescannez.',
    )
  }

  // Overview photos from the selected place panel only
  let imageUrls = extractPlacePhotos(detailRoot)

  await ensurePhotosTabOpen(detailRoot)
  await scrollPhotosPanel(detailRoot)
  await delay(500)

  imageUrls = extractPlacePhotos(detailRoot)

  const core = scrapePlace()
  core.imageUrls = imageUrls

  await ensureReviewsTabOpen(detailRoot)
  await scrollReviewPanel(detailRoot)
  await delay(600)

  core.reviews = extractReviews(extractJsonLd())

  return core
}

async function waitForDetailRoot(maxMs = 15000) {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const root = getPlaceDetailRoot()
    if (root) return root
    await delay(500)
  }
  return null
}

function normalizeMapsHref(href) {
  try {
    return new URL(href, location.origin).href
  } catch {
    return href
  }
}

function placeIdFromUrl(url) {
  const normalized = normalizeMapsHref(url)
  const fromUrl = extractPlaceIdFromUrl(normalized)
  if (fromUrl) {
    return fromUrl.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
  }
  try {
    const pathMatch = new URL(normalized).pathname.match(/\/place\/([^/@]+)/)
    if (pathMatch) {
      return decodeURIComponent(pathMatch[1].replace(/\+/g, ' '))
        .replace(/\W+/g, '-')
        .slice(0, 40)
    }
    return btoa(encodeURIComponent(normalized)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)
  } catch {
    return normalized.slice(-24)
  }
}

async function scrollSearchFeedBriefly() {
  const feed = document.querySelector('[role="feed"]')
  if (!feed) return
  for (let i = 0; i < 4; i += 1) {
    feed.scrollTop += 700
    await delay(350)
  }
}

function listPlacesOnPage() {
  const places = []
  const seen = new Set()

  function addPlace(item) {
    const key = item.mapsUrl || item.name
    if (!key || seen.has(key)) return
    seen.add(key)
    places.push(item)
  }

  function cardFromLink(link) {
    return (
      link.closest('.Nv2PK') ||
      link.closest('.lI9IFe') ||
      link.closest('[jsaction*="mouseover"]') ||
      link.parentElement?.parentElement
    )
  }

  const feedLinks = document.querySelectorAll(
    '[role="feed"] a.hfpxzc[href*="/maps"], [role="feed"] a[href*="/maps/place/"]',
  )

  for (const link of feedLinks) {
    const card = cardFromLink(link)
    const label = link.getAttribute('aria-label') || ''
    const name =
      text(card?.querySelector('.qBF1Pd, .fontHeadlineSmall, .NrDZNb')) ||
      label.split('·')[0].split(',')[0].trim()
    if (!name || isGenericPlaceName(name)) continue

    const ratingEl = card?.querySelector(
      'span[role="img"][aria-label*="star" i], span[role="img"][aria-label*="étoile" i], span[role="img"][aria-label*="stars" i]',
    )
    const rating = ratingEl
      ? parseRatingLabel(ratingEl.getAttribute('aria-label') || '')
      : null

    const address = card
      ? [...card.querySelectorAll('.W4Efsd, .W4Efsd span')]
          .map(text)
          .filter(Boolean)
          .join(' · ')
          .slice(0, 140)
      : ''

    addPlace({
      id: placeIdFromUrl(link.href),
      name,
      address,
      rating,
      mapsUrl: normalizeMapsHref(link.href),
    })
  }

  const detailRoot = getPlaceDetailRoot()
  if (detailRoot) {
    try {
      const name = extractName()
      addPlace({
        id: placeIdFromUrl(location.href),
        name,
        address: extractAddress() || '',
        rating: null,
        mapsUrl: normalizeMapsHref(location.href),
        isCurrent: true,
      })
    } catch {
      /* no open detail */
    }
  }

  return places
}

async function listPlacesAsync() {
  await scrollSearchFeedBriefly()
  return listPlacesOnPage()
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'PING') {
    sendResponse({ ok: true })
    return false
  }

  if (message?.type === 'LIST_PLACES') {
    listPlacesAsync()
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : 'Liste impossible',
        })
      })
    return true
  }

  if (message?.type !== 'SCRAPE_PLACE') return

  scrapePlaceAsync()
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : 'Scrape failed',
      })
    })

  return true
})
