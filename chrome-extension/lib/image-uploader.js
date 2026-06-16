const KEY_HEADER = 'X-Extension-Key'

/**
 * Download images in the extension context (Google CDN blocks server-side fetch)
 * and upload them to the app.
 * @param {string[]} remoteUrls
 * @param {{ apiBaseUrl: string; extensionKey: string }} config
 * @returns {Promise<string[]>} local /uploads/... paths
 */
export async function uploadPlaceImages(remoteUrls, config) {
  const base = config.apiBaseUrl.replace(/\/$/, '')
  const localPaths = []

  for (const raw of remoteUrls.slice(0, 12)) {
    const url = raw?.trim()
    if (!url?.startsWith('http')) continue

    try {
      const res = await fetch(url, { referrerPolicy: 'no-referrer' })
      if (!res.ok) continue

      const blob = await res.blob()
      if (!blob.type.startsWith('image/') || blob.size < 2048) continue

      const form = new FormData()
      form.append('file', blob, 'place-photo.jpg')

      const uploadRes = await fetch(`${base}/api/extension/upload`, {
        method: 'POST',
        headers: { [KEY_HEADER]: config.extensionKey },
        body: form,
      })

      const data = await uploadRes.json().catch(() => ({}))
      if (uploadRes.ok && data.url) {
        localPaths.push(data.url)
      }
    } catch {
      /* skip failed image */
    }
  }

  return localPaths
}
