'use client'

import dynamic from 'next/dynamic'

const ChatBotWidget = dynamic(() => import('@/components/ChatBotWidget'), { ssr: false })
const TrackingPixels = dynamic(() => import('@/components/tracking-pixels'), { ssr: false })
const AdSenseBootstrap = dynamic(() => import('@/components/adsense-bootstrap').then((m) => m.AdSenseBootstrap), {
  ssr: false,
})

export function DeferredClientWidgets() {
  return (
    <>
      <AdSenseBootstrap />
      <ChatBotWidget />
      <TrackingPixels />
    </>
  )
}
