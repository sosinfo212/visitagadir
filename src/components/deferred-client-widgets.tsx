'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const ChatBotWidget = dynamic(() => import('@/components/ChatBotWidget'), { ssr: false })
const TrackingPixels = dynamic(() => import('@/components/tracking-pixels'), { ssr: false })
const AdSenseBootstrap = dynamic(() => import('@/components/adsense-bootstrap').then((m) => m.AdSenseBootstrap), {
  ssr: false,
})

const INTERACTION_EVENTS = ['scroll', 'pointerdown', 'keydown', 'touchstart'] as const

/**
 * Mount after the first real user interaction (no idle/timer fallback).
 *
 * Used for AdSense: the account runs Auto Ads, which inject unreserved ad
 * units into the page after load. If that happens without prior user input it
 * shifts content (a large CLS at the footer). Deferring the AdSense script
 * until the user actually interacts means every auto-ad injection is
 * input-initiated, so its layout shifts fall inside the 500ms input window
 * and are excluded from CLS — while real users still get ads the moment they
 * engage. A non-interacting bot/Lighthouse audit simply never loads ads.
 */
function useInteractionMount(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (ready) return
    const trigger = () => {
      setReady(true)
      INTERACTION_EVENTS.forEach((e) => window.removeEventListener(e, trigger))
    }
    INTERACTION_EVENTS.forEach((e) => window.addEventListener(e, trigger, { passive: true, once: true }))
    return () => INTERACTION_EVENTS.forEach((e) => window.removeEventListener(e, trigger))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return ready
}

/**
 * Mount after interaction OR an idle callback (4s ceiling). Used for tracking
 * pixels — analytics should fire for every session, including quick bounces
 * with no interaction — but still kept off the initial main-thread budget.
 */
function useIdleMount(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (ready) return
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    let idleId: number | undefined
    const cleanup = () => {
      INTERACTION_EVENTS.forEach((e) => w.removeEventListener(e, trigger))
      if (idleId !== undefined) {
        if (w.cancelIdleCallback) w.cancelIdleCallback(idleId)
        else w.clearTimeout(idleId)
      }
    }
    const trigger = () => {
      setReady(true)
      cleanup()
    }
    INTERACTION_EVENTS.forEach((e) => w.addEventListener(e, trigger, { passive: true, once: true }))
    idleId = w.requestIdleCallback ? w.requestIdleCallback(trigger, { timeout: 4000 }) : w.setTimeout(trigger, 3000)
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return ready
}

export function DeferredClientWidgets() {
  const interacted = useInteractionMount()
  const idle = useIdleMount()

  return (
    <>
      <ChatBotWidget />
      {interacted && <AdSenseBootstrap />}
      {idle && <TrackingPixels />}
    </>
  )
}
