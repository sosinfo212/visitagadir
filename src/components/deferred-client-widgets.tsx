'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const ChatBotWidget = dynamic(() => import('@/components/ChatBotWidget'), { ssr: false })
const TrackingPixels = dynamic(() => import('@/components/tracking-pixels'), { ssr: false })
const AdSenseBootstrap = dynamic(() => import('@/components/adsense-bootstrap').then((m) => m.AdSenseBootstrap), {
  ssr: false,
})

/**
 * Mount heavy third-party widgets (AdSense, tracking pixels) only after the
 * page is interactive — on first user interaction, or an idle callback with a
 * 4s ceiling, whichever comes first. Keeps ~1s of ad/analytics JS off the
 * initial main-thread budget (GTmetrix TBT / TTI) without dropping the scripts.
 */
function useDeferredMount(): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (ready) return
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    const events = ['scroll', 'pointerdown', 'keydown', 'touchstart'] as const
    let idleId: number | undefined

    const cleanup = () => {
      events.forEach((e) => w.removeEventListener(e, trigger))
      if (idleId !== undefined) {
        if (w.cancelIdleCallback) w.cancelIdleCallback(idleId)
        else w.clearTimeout(idleId)
      }
    }

    const trigger = () => {
      setReady(true)
      cleanup()
    }

    events.forEach((e) => w.addEventListener(e, trigger, { passive: true, once: true }))

    idleId = w.requestIdleCallback
      ? w.requestIdleCallback(trigger, { timeout: 4000 })
      : w.setTimeout(trigger, 3000)

    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return ready
}

export function DeferredClientWidgets() {
  const ready = useDeferredMount()

  return (
    <>
      <ChatBotWidget />
      {ready && <AdSenseBootstrap />}
      {ready && <TrackingPixels />}
    </>
  )
}
