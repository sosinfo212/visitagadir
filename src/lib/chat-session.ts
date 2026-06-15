export type ChatMessage = { role: 'user' | 'bot'; text: string }

const SESSION_ID_KEY = 'agadir-chat-session-id'
const MESSAGES_KEY = 'agadir-chat-messages'
const UNREAD_KEY = 'agadir-chat-unread'

export const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [
  { role: 'bot', text: 'Hi! How can I help you today?' },
]

export function getStoredSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem(SESSION_ID_KEY)
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    sessionStorage.setItem(SESSION_ID_KEY, id)
  }
  return id
}

export function getStoredMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return DEFAULT_CHAT_MESSAGES
  try {
    const raw = sessionStorage.getItem(MESSAGES_KEY)
    if (!raw) return DEFAULT_CHAT_MESSAGES
    const parsed = JSON.parse(raw) as ChatMessage[]
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CHAT_MESSAGES
    return parsed
  } catch {
    return DEFAULT_CHAT_MESSAGES
  }
}

export function saveMessages(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages))
  } catch {
    // Quota exceeded or private mode — ignore
  }
}

export function hasUnreadMessages(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(UNREAD_KEY) === '1'
}

export function markChatUnread(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(UNREAD_KEY, '1')
}

export function markChatRead(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(UNREAD_KEY)
}
