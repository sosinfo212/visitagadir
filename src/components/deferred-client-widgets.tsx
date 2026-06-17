'use client'

import dynamic from 'next/dynamic'

const ChatBotWidget = dynamic(() => import('@/components/ChatBotWidget'), { ssr: false })
const TrackingPixels = dynamic(() => import('@/components/tracking-pixels'), { ssr: false })

export function DeferredClientWidgets() {
  return (
    <>
      <ChatBotWidget />
      <TrackingPixels />
    </>
  )
}
