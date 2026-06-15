'use client'

import { useEffect, useState } from 'react'

interface AdConfig {
  adsEnabled: boolean
  publisherId: string
  showPlaceholders: boolean
  placements: Array<{
    id: string
    name: string
    location: string
    slotId: string | null
    format: string
    adType: string
    customHtml: string | null
  }>
}

let adsenseScriptLoaded = false
let adsenseScriptLoading = false

function loadAdSenseScript(publisherId: string) {
  if (adsenseScriptLoaded || adsenseScriptLoading || !publisherId || publisherId === 'ca-pub-XXXXXXXXXXXXXXXX') return
  adsenseScriptLoading = true

  // Opt out of AdSense Auto ads (e.g. "Discover more" below footer); manual slots only.
  try {
    // @ts-expect-error adsbygoogle is injected by Google
    ;(window.adsbygoogle = window.adsbygoogle || []).push({
      google_ad_client: publisherId,
      enable_page_level_ads: false,
    })
  } catch {
    // ignore
  }

  const script = document.createElement('script')
  script.async = true
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`
  script.crossOrigin = 'anonymous'
  script.onload = () => {
    adsenseScriptLoaded = true
    adsenseScriptLoading = false
  }
  script.onerror = () => {
    adsenseScriptLoading = false
  }
  document.head.appendChild(script)
}

function AdPlaceholder({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div
      className={`bg-muted/30 border border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center py-3 px-4 text-xs text-muted-foreground/50 ${className}`}
    >
      <span>Ad Space — {label}</span>
    </div>
  )
}

function AdSenseSlot({
  publisherId,
  slot,
  format = 'auto',
  showPlaceholder = true,
  label = '',
  className = '',
}: {
  publisherId: string
  slot: string
  format?: string
  showPlaceholder?: boolean
  label?: string
  className?: string
}) {
  useEffect(() => {
    if (!slot || !publisherId) return
    try {
      // @ts-expect-error adsbygoogle is injected by Google
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // AdSense not loaded yet
    }
  }, [slot, publisherId])

  if (!slot || !publisherId) {
    if (showPlaceholder) return <AdPlaceholder label={label} className={className} />
    return null
  }

  return (
    <div className={`ad-container max-w-full overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}

export function DynamicAdSlot({ location, className = '' }: { location: string; className?: string }) {
  const [config, setConfig] = useState<AdConfig | null>(null)

  useEffect(() => {
    fetch('/api/ads')
      .then((r) => r.json())
      .then((data) => setConfig(data))
      .catch(() => setConfig(null))
  }, [])

  if (!config) return null
  if (!config.adsEnabled) return null

  const placement = config.placements.find((p) => p.location === location)
  if (!placement) return null

  if (placement.adType === 'custom') {
    if (!placement.customHtml) return null
    return (
      <div
        className={`max-w-full overflow-hidden ${className}`}
        dangerouslySetInnerHTML={{ __html: placement.customHtml }}
      />
    )
  }

  const hasRealAdSense =
    !!placement.slotId &&
    !!config.publisherId &&
    config.publisherId !== 'ca-pub-XXXXXXXXXXXXXXXX'

  if (!hasRealAdSense) {
    if (!config.showPlaceholders) return null
    return <AdPlaceholder label={placement.name} className={className} />
  }

  if (typeof window !== 'undefined') loadAdSenseScript(config.publisherId)

  return (
    <AdSenseSlot
      publisherId={config.publisherId}
      slot={placement.slotId!}
      format={placement.format}
      showPlaceholder={false}
      label={placement.name}
      className={className}
    />
  )
}
