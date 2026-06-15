'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { categoryPath } from '@/lib/seo/url'
import type { AppSettingsPublic } from '@/lib/app-settings'

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

export function SiteFooter({ branding }: { branding?: AppSettingsPublic | null }) {
  const [categories, setCategories] = useState<CategoryLink[]>([])
  const [footerBranding, setFooterBranding] = useState(() => footerBrandingFromSettings(branding))

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/settings/public').then((r) => r.json()).catch(() => null),
    ]).then(([cats, settings]) => {
      setCategories(Array.isArray(cats) ? cats : [])
      if (settings?.siteName) {
        setFooterBranding(footerBrandingFromSettings(settings))
      }
    })
  }, [])

  const firstCategories = categories.slice(0, 5)
  const moreCategories = categories.slice(5, 10)

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src={footerBranding.footerLogoUrl}
                alt={footerBranding.siteName}
                className="rounded-lg object-contain"
                style={{
                  width: footerBranding.footerLogoWidth,
                  height: footerBranding.footerLogoHeight,
                }}
              />
              <span className="font-bold text-lg">{footerBranding.siteName}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your complete guide to discovering the best of Agadir, Morocco. Find restaurants, hotels, beaches, services, and more.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Categories</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {firstCategories.map((cat) => (
                <li key={cat.id}>
                  <Link href={categoryPath(cat.slug)} className="hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">More Categories</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {moreCategories.map((cat) => (
                <li key={cat.id}>
                  <Link href={categoryPath(cat.slug)} className="hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">About</h4>
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
