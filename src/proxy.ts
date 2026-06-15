/**
 * Proxy (Next 16+) — replaces the legacy `middleware.ts` convention.
 *
 * Purpose: HTTP-level redirect rules managed in the admin UI.
 *
 * Implementation notes:
 *  - Runs on the Node.js runtime because Prisma can't reliably run on
 *    the Edge runtime. Next.js 15+/16 supports `runtime: 'nodejs'`.
 *  - Redirect map is cached in-process for ~60s so even 100k+ rows cost
 *    at most one DB query per minute per pod (see `lib/seo/cache.ts`).
 *  - Static assets, API, and /admin are excluded via `matcher` so this
 *    proxy never blocks them or pollutes their request timing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { findRedirect, incrementRedirectHits } from '@/lib/seo/repository'

export const config = {
  matcher: [
    // Everything except _next/*, api/*, admin/* and files with extensions.
    '/((?!_next/|api/|admin/|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|css|js|map|txt|xml|webmanifest)$).*)',
  ],
}

export default async function proxy(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname
    const rule = await findRedirect(path)
    if (!rule || !rule.enabled) return NextResponse.next()

    // Fire-and-forget hit counter — not awaited so the redirect stays fast.
    incrementRedirectHits(rule.id).catch(() => {})

    const dest = rule.destination.startsWith('http')
      ? new URL(rule.destination)
      : new URL(rule.destination, req.url)

    return NextResponse.redirect(dest, { status: rule.statusCode as 301 | 302 | 307 | 308 })
  } catch (e) {
    // Never let middleware break a request — log and pass through.
    console.error('SEO proxy error:', e)
    return NextResponse.next()
  }
}
