'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { categoryPath } from '@/lib/seo/url'
import type { AppSettingsPublic } from '@/lib/app-settings'
import { OptimizedImage } from '@/components/optimized-image'

interface CategoryLink {
  id: string
  name: string
  slug: string
}

function footerBrandingFromSettings(branding?: AppSettingsPublic | null) {
  return {
    siteName: branding?.siteName ?? 'Agadir Directory',
    footerLogoUrl: branding?.footerLogoUrl || branding?.siteLogoUrl || '/agadir-logo.png',
    footerLogoWidth: branding?.footerLogoWidth ?? 32,
    footerLogoHeight: branding?.footerLogoHeight ?? 32,
  }
}

export function SiteFooter({
  branding,
  categories: initialCategories = [],
}: {
  branding?: AppSettingsPublic | null
  categories?: CategoryLink[]
}) {
  const [categories, setCategories] = useState<CategoryLink[]>(initialCategories)
  const [footerBranding] = useState(() => footerBrandingFromSettings(branding))

  // Categories + branding come from server props (root layout). Fall back to
  // a client fetch only when the server provided none.
  useEffect(() => {
    if (initialCategories.length > 0) return
    fetch('/api/categories')
      .then((r) => r.json())
      .then((cats) => setCategories(Array.isArray(cats) ? cats : []))
      .catch(() => { /* non-critical */ })
  }, [initialCategories.length])

  const firstCategories = categories.slice(0, 5)
  const moreCategories = categories.slice(5, 10)

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <OptimizedImage
                src={footerBranding.footerLogoUrl}
                alt={footerBranding.siteName}
                width={footerBranding.footerLogoWidth}
                height={footerBranding.footerLogoHeight}
                className="rounded-lg object-contain"
                style={{
                  width: footerBranding.footerLogoWidth,
                  height: footerBranding.footerLogoHeight,
                }}
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your complete guide to discovering the best of Agadir, Morocco. Find restaurants, hotels, beaches, services, and more.
            </p>
          </div>

          <div>
            <h2 className="font-semibold mb-3">Categories</h2>
            <ul className="space-y-2 text-sm text-gray-400 min-h-[7.5rem]">
              {firstCategories.length > 0 ? (
                firstCategories.map((cat) => (
                  <li key={cat.id}>
                    <Link href={categoryPath(cat.slug)} className="hover:text-white transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                Array.from({ length: 5 }).map((_, i) => (
                  <li key={`cat-skeleton-${i}`} className="h-5 rounded bg-gray-800/60 animate-pulse" aria-hidden="true" />
                ))
              )}
            </ul>
          </div>

          <div>
            <h2 className="font-semibold mb-3">More Categories</h2>
            <ul className="space-y-2 text-sm text-gray-400 min-h-[7.5rem]">
              {moreCategories.length > 0 ? (
                moreCategories.map((cat) => (
                  <li key={cat.id}>
                    <Link href={categoryPath(cat.slug)} className="hover:text-white transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                Array.from({ length: 5 }).map((_, i) => (
                  <li key={`more-cat-skeleton-${i}`} className="h-5 rounded bg-gray-800/60 animate-pulse" aria-hidden="true" />
                ))
              )}
            </ul>
          </div>

          <div>
            <h2 className="font-semibold mb-3">About</h2>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/advertise" className="hover:text-white transition-colors">Advertise</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-gray-800" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} {footerBranding.siteName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <p>Made with ❤️ in Agadir, Morocco</p>
            <Link href="/admin/login" className="text-gray-500 hover:text-gray-300 transition-colors text-xs">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
