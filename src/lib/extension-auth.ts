import { NextRequest } from 'next/server'

const HEADER = 'x-extension-key'

function normalizeKey(value: string | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  // Strip wrapping quotes if present in raw env
  return trimmed.replace(/^["']|["']$/g, '')
}

export function getExtensionApiKey(): string | undefined {
  return normalizeKey(process.env.EXTENSION_API_KEY)
}

export function isExtensionAuthorized(request: NextRequest): boolean {
  const expected = getExtensionApiKey()
  if (!expected) return false
  const provided = request.headers.get(HEADER)?.trim()
  return Boolean(provided && provided === expected)
}

export { HEADER as EXTENSION_KEY_HEADER }
