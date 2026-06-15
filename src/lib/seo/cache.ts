/**
 * Tiny in-memory TTL cache for hot SEO config (singletons + redirect map).
 *
 * Production-wise this is process-local and good enough for one-instance
 * Next.js deployments. Behind a multi-instance fleet you'd swap the backing
 * store for Redis with the same interface.
 */

type Entry<T> = { value: T; expiresAt: number }

const store = new Map<string, Entry<unknown>>()

export function cacheGet<T>(key: string): T | null {
  const hit = store.get(key) as Entry<T> | undefined
  if (!hit) return null
  if (hit.expiresAt < Date.now()) {
    store.delete(key)
    return null
  }
  return hit.value
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function cacheInvalidate(prefix?: string): void {
  if (!prefix) {
    store.clear()
    return
  }
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k)
  }
}
