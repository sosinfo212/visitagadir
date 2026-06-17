'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X } from 'lucide-react'
import { hasUnreadMessages, markChatRead } from '@/lib/chat-session'

const ChatBot = dynamic(() => import('@/components/ChatBot'), { ssr: false })

export default function ChatBotWidget() {
  const [open, setOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setHasUnread(hasUnreadMessages())
  }, [])

  useEffect(() => {
    if (open) {
      markChatRead()
      setHasUnread(false)
    }
  }, [open])

  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <>
      <div
        className={`fixed bottom-20 right-4 sm:right-6 z-50 w-[min(calc(100vw-2rem),400px)] h-[min(520px,calc(100vh-6rem))] shadow-2xl rounded-xl overflow-hidden bg-white transition-opacity duration-200 ${
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none invisible'
        }`}
        role="dialog"
        aria-label="Chat assistant"
        aria-hidden={!open}
      >
        {open ? (
          <ChatBot
            isOpen={open}
            onClose={() => setOpen(false)}
            onUnread={() => setHasUnread(true)}
          />
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 sm:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-colors hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        aria-label={
          !open && hasUnread
            ? 'Open chat assistant — new message'
            : open
              ? 'Close chat'
              : 'Open chat assistant'
        }
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && hasUnread && (
          <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500" />
          </span>
        )}
      </button>
    </>
  )
}
