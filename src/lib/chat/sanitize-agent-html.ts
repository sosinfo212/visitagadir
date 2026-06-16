'use client'

import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'a',
  'b',
  'br',
  'div',
  'em',
  'h3',
  'h4',
  'i',
  'li',
  'ol',
  'p',
  'strong',
  'span',
  'ul',
]

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class']

let hooksConfigured = false

function configureHooks() {
  if (hooksConfigured || typeof window === 'undefined') return
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
  })
  hooksConfigured = true
}

/** Sanitize HTML from the chat agent before rendering in the UI. */
export function sanitizeAgentHtml(html: string): string {
  configureHooks()
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  })
}
