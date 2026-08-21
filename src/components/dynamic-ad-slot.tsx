'use client'

import { loadAdSenseScript } from '@/lib/adsense-loader'
import { useEffect, useRef, useState } from 'react'

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

/** Reserve height while config loads or when an ad may still render — prevents layout shift. */
const LOCATION_MIN_HEIGHT: Record<string, string> = {
  header_banner: 'min-h-[90px]',
  featured_feed: 'min-h-[90px]',
  bottom_banner: 'min-h-[90px]',
  category_banner: 'min-h-[90px]',
  listings_feed: 'min-h-[90px]',
  article_inline: 'min-h-[90px]',
  blog_list_feed: 'min-h-[90px]',
  blog_content_inline: 'min-h-[250px]',
  blog_list_sidebar: 'min-h-[250px]',
  sidebar_rectangle: 'min-h-[250px]',
}

function reservedClassName(location: string, className: string) {
  const reserved = LOCATION_MIN_HEIGHT[location] ?? 'min-h-[90px]'
  if (className.includes('min-h-')) return className
  return `${reserved} ${className}`.trim()
}

function AdReservedSpace({ className = '' }: { className?: string }) {
  return (
    <div
      className={`ad-container w-full max-w-full min-w-0 ${className}`}
      aria-hidden="true"
    />
  )
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
  const containerRef = useRef<HTMLDivElement>(null)
  const pushedRef = useRef(false)

  useEffect(() => {
    if (!slot || !publisherId || pushedRef.current) return
    const node = containerRef.current
    if (!node) return

    const fillSlot = () => {
      if (pushedRef.current || node.getBoundingClientRect().width <= 0) return
      pushedRef.current = true
      try {
        // @ts-expect-error adsbygoogle is injected by Google
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch {
        pushedRef.current = false
      }
    }

    const observer = new ResizeObserver(() => fillSlot())
    observer.observe(node)
    requestAnimationFrame(fillSlot)

    return () => observer.disconnect()
  }, [slot, publisherId])

  if (!slot || !publisherId) {
    if (showPlaceholder) return <AdPlaceholder label={label} className={className} />
    return null
  }

  return (
    <div ref={containerRef} className={`ad-container w-full max-w-full min-w-0 ${className}`}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          minHeight: format === 'fluid' ? 90 : format === 'rectangle' ? 250 : 90,
        }}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}

export function DynamicAdSlot({
  location,
  className = '',
  lazy = true,
}: {
  location: string
  className?: string
  lazy?: boolean
}) {
  const [config, setConfig] = useState<AdConfig | null>(null)
  const [visible, setVisible] = useState(!lazy)
  const containerRef = useRef<HTMLDivElement>(null)

  // Only fetch the ad config once the slot is (near) visible — below-fold ads
  // no longer pull /api/ads + adsbygoogle.js into the initial page load.
  useEffect(() => {
    if (!visible) return
    fetch('/api/ads')
      .then((r) => r.json())
      .then((data) => setConfig(data))
      .catch(() => setConfig(null))
  }, [visible])

  useEffect(() => {
    if (!lazy || visible) return
    const node = containerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [lazy, visible])

  if (!visible) {
    return <div ref={containerRef} className={reservedClassName(location, className)} aria-hidden="true" />
  }

  const slotClassName = reservedClassName(location, className)

  if (!config) {
    return <AdReservedSpace className={slotClassName} />
  }
  if (!config.adsEnabled) {
    return <AdReservedSpace className={slotClassName} />
  }

  const placement = config.placements.find((p) => p.location === location)
  if (!placement) {
    return <AdReservedSpace className={slotClassName} />
  }

  if (placement.adType === 'custom') {
    if (!placement.customHtml) return <AdReservedSpace className={slotClassName} />
    return (
      <div
        className={`ad-container w-full max-w-full min-w-0 ${slotClassName}`}
        dangerouslySetInnerHTML={{ __html: placement.customHtml }}
      />
    )
  }

  const hasRealAdSense =
    !!placement.slotId &&
    !!config.publisherId &&
    config.publisherId !== 'ca-pub-XXXXXXXXXXXXXXXX'

  if (!hasRealAdSense) {
    if (!config.showPlaceholders) return <AdReservedSpace className={slotClassName} />
    return <AdPlaceholder label={placement.name} className={slotClassName} />
  }

  if (typeof window !== 'undefined') loadAdSenseScript(config.publisherId)

  return (
    <AdSenseSlot
      publisherId={config.publisherId}
      slot={placement.slotId!}
      format={placement.format}
      showPlaceholder={false}
      label={placement.name}
      className={slotClassName}
    />
  )
}
