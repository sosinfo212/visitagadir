'use client'

import { useEffect } from 'react'
import { loadAdSenseScript } from '@/lib/adsense-loader'

/** Loads the AdSense script once when ads are enabled (supports Auto ads from the AdSense dashboard). */
export function AdSenseBootstrap() {
  useEffect(() => {
    fetch('/api/ads')
      .then((r) => r.json())
      .then((data) => {
        if (
          data.adsEnabled &&
          data.publisherId &&
          data.publisherId !== 'ca-pub-XXXXXXXXXXXXXXXX'
        ) {
          loadAdSenseScript(data.publisherId)
        }
      })
      .catch(() => {})
  }, [])

  return null
}
