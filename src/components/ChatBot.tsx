'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { isHtmlContent } from '@/lib/blog/html'
import { sanitizeAgentHtml } from '@/lib/chat/sanitize-agent-html'
import {
  type ChatMessage,
  DEFAULT_CHAT_MESSAGES,
  getStoredMessages,
  getStoredSessionId,
  markChatUnread,
  saveMessages,
} from '@/lib/chat-session'

type ChatBotProps = {
  isOpen?: boolean
  onClose?: () => void
  onUnread?: () => void
}

function BotMessageContent({ text }: { text: string }) {
  if (!isHtmlContent(text)) {
    return <>{text}</>
  }

  return (
    <div
      className="chat-agent-html space-y-2 [&_a]:text-violet-700 [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-4 [&_p+p]:mt-2 [&_ul]:list-disc [&_ul]:pl-4"
      dangerouslySetInnerHTML={{ __html: sanitizeAgentHtml(text) }}
    />
  )
}

export default function ChatBot({ isOpen = true, onClose, onUnread }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_CHAT_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const sessionId = useRef('')
  const isOpenRef = useRef(isOpen)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  useEffect(() => {
    sessionId.current = getStoredSessionId()
    setMessages(getStoredMessages())
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages)
    }
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function notifyUnreadIfClosed() {
    if (!isOpenRef.current) {
      markChatUnread()
      onUnread?.()
    }
  }

  async function send() {
    if (!input.trim() || loading) return
    if (!sessionId.current) {
      sessionId.current = getStoredSessionId()
    }
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, sessionId: sessionId.current }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: 'Something went wrong. Please try again.' },
        ])
        notifyUnreadIfClosed()
        return
      }
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: data.reply || 'No response received.' },
      ])
      notifyUnreadIfClosed()
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Something went wrong. Please try again.' },
      ])
      notifyUnreadIfClosed()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-sm font-medium">
          AI
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">Agadir Assistant</p>
          <p className="text-xs text-gray-400">Ask about businesses &amp; places</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-violet-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {m.role === 'user' ? m.text : <BotMessageContent text={m.text} />}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
              <span className="flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 p-3 flex gap-2">
        <input
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 transition-colors"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  )
}
