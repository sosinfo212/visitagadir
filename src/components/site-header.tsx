'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Home as HomeIcon,
  Menu,
  X,
  Plus,
  ChevronDown,
  Building2,
  LogIn,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { categoryBgColors, getCategoryIcon } from '@/lib/category-icons'
import { categoryPath } from '@/lib/seo/url'
import { AddBusinessModal, type CategoryWithCount } from '@/components/add-business-modal'

const businessLoginUrl = '/login?callbackUrl=%2Fmy-listings'

export function SiteHeader() {
  return (
    <Suspense fallback={<SiteHeaderFallback />}>
      <SiteHeaderInner />
    </Suspense>
  )
}

function SiteHeaderFallback() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
      </div>
    </header>
  )
}

function SiteHeaderInner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [siteBranding, setSiteBranding] = useState({
    siteName: 'Agadir Directory',
    siteLogoUrl: '/agadir-logo.png',
    siteLogoWidth: 32,
    siteLogoHeight: 32,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false)
  const [addBusinessOpen, setAddBusinessOpen] = useState(false)

  const desktopDropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const activeCategorySlug = useMemo(() => {
    if (!pathname?.startsWith('/category/')) return null
    const slug = pathname.slice('/category/'.length).split('/')[0]
    return slug ? decodeURIComponent(slug) : null
  }, [pathname])

  const activeCategoryData = useMemo(
    () => categories.find((c) => c.slug === activeCategorySlug),
    [categories, activeCategorySlug],
  )

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/settings/public').then((r) => r.json()).catch(() => null),
    ]).then(([cats, branding]) => {
      const catsWithCount = (Array.isArray(cats) ? cats : []).map(
        (c: CategoryWithCount & { _count?: { listings: number } }) => ({
          ...c,
          listingCount: c.listingCount ?? c._count?.listings ?? 0,
        }),
      )
      setCategories(catsWithCount)
      if (branding?.siteName) {
        setSiteBranding({
          siteName: branding.siteName,
          siteLogoUrl: branding.siteLogoUrl || '/agadir-logo.png',
          siteLogoWidth: branding.siteLogoWidth || 32,
          siteLogoHeight: branding.siteLogoHeight || 32,
        })
      }
    })
  }, [])

  useEffect(() => {
    const q = searchParams.get('search')?.trim() ?? ''
    if (pathname === '/' && q) {
      setSearchQuery(q)
    }
  }, [pathname, searchParams])

  const handleListBusiness = useCallback(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/login?callbackUrl=/?listBusiness=1')
      return
    }
    setAddBusinessOpen(true)
  }, [session, status, router])

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('listBusiness') === '1') {
      setAddBusinessOpen(true)
      params.delete('listBusiness')
      const next = params.toString() ? `${pathname}?${params.toString()}` : pathname || '/'
      window.history.replaceState({}, '', next)
    }
  }, [session, status, pathname])

  const goHome = () => {
    setMobileMenuOpen(false)
    router.push('/')
  }

  const goCategory = (slug: string) => {
    setMobileMenuOpen(false)
    setDesktopDropdownOpen(false)
    router.push(categoryPath(slug))
  }

  const handleSearch = () => {
    const q = searchQuery.trim()
    setMobileMenuOpen(false)
    if (!q) {
      router.push('/')
      return
    }
    router.push(`/?search=${encodeURIComponent(q)}`)
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            <button
              onClick={goHome}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
            >
              <img
                src={siteBranding.siteLogoUrl}
                alt={siteBranding.siteName}
                className="rounded-lg object-contain"
                style={{
                  width: siteBranding.siteLogoWidth,
                  height: siteBranding.siteLogoHeight,
                }}
              />
            </button>

            <div className="hidden md:flex items-center gap-1 flex-1 max-w-2xl mx-4">
              <button
                onClick={goHome}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-foreground"
              >
                <HomeIcon className="h-4 w-4" />
                <span>Home</span>
              </button>

              <div className="w-px h-6 bg-border mx-1" />

              <div
                ref={desktopDropdownRef}
                className="relative"
                onMouseEnter={() => setDesktopDropdownOpen(true)}
                onMouseLeave={() => setDesktopDropdownOpen(false)}
              >
                <button
                  onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="text-muted-foreground">
                    {activeCategoryData ? getCategoryIcon(activeCategoryData.icon) : <Menu className="h-4 w-4" />}
                  </span>
                  <span className="max-w-[120px] truncate">
                    {activeCategoryData?.name.split(' & ')[0] || 'Categories'}
                  </span>
                  <motion.div
                    animate={{ rotate: desktopDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {desktopDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-xl border shadow-xl z-50 overflow-hidden"
                    >
                      <div className="px-3 py-2 border-b bg-muted/30">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Browse Categories
                        </p>
                      </div>
                      <div className="p-1.5 max-h-[65vh] overflow-y-auto">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => goCategory(cat.slug)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                              activeCategorySlug === cat.slug
                                ? 'bg-gradient-to-r from-orange-50 to-teal-50 text-orange-700 font-medium'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            <span className="text-muted-foreground">{getCategoryIcon(cat.icon)}</span>
                            <span className="flex-1">{cat.name}</span>
                            <span className="text-xs text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
                              {cat.listingCount}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search Agadir..."
                    className="pl-9 h-9 rounded-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button type="button" size="sm" className="h-9 shrink-0" onClick={handleSearch}>
                  Search
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {session?.user ? (
                <Link href="/my-listings" className="hidden sm:block">
                  <Button variant="outline" size="sm" className="h-9 rounded-lg text-sm">
                    My Listings
                  </Button>
                </Link>
              ) : status !== 'loading' ? (
                <Link href={businessLoginUrl} className="hidden sm:block">
                  <Button variant="outline" size="sm" className="h-9 rounded-lg text-sm gap-1.5">
                    <LogIn className="h-4 w-4" />
                    Business Login
                  </Button>
                </Link>
              ) : null}
              <motion.div
                className="hidden sm:block"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(249, 115, 22, 0)',
                    '0 0 12px 2px rgba(249, 115, 22, 0.3)',
                    '0 0 0 0 rgba(249, 115, 22, 0)',
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Button
                  onClick={handleListBusiness}
                  className="h-9 px-4 bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white font-medium rounded-lg shadow-sm gap-1.5 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  List Business
                </Button>
              </motion.div>

              {!session?.user && status !== 'loading' && (
                <Link href={businessLoginUrl} className="sm:hidden">
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" aria-label="Business login">
                    <LogIn className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Button
                onClick={handleListBusiness}
                size="icon"
                className="sm:hidden h-9 w-9 bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white rounded-lg shadow-sm"
              >
                <Plus className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="sm:hidden pb-2.5 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Agadir..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button type="button" size="sm" className="h-9 shrink-0" onClick={handleSearch}>
              Go
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              ref={mobileMenuRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="md:hidden border-t overflow-hidden bg-white"
            >
              <div className="max-w-7xl mx-auto px-4 py-4">
                <button
                  onClick={goHome}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all bg-gradient-to-r from-orange-50 to-teal-50 border border-orange-200 mb-3 w-full"
                >
                  <HomeIcon className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-700">Home</span>
                </button>

                {session?.user ? (
                  <Link
                    href="/my-listings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all bg-white border mb-3 w-full hover:bg-gray-50"
                  >
                    <Building2 className="h-4 w-4 text-teal-600" />
                    <span>My Listings</span>
                  </Link>
                ) : status !== 'loading' ? (
                  <Link
                    href={businessLoginUrl}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all bg-white border mb-3 w-full hover:bg-gray-50"
                  >
                    <LogIn className="h-4 w-4 text-orange-600" />
                    <span>Business Login</span>
                  </Link>
                ) : null}

                <div className="grid grid-cols-2 gap-1.5">
                  {categories.map((cat, i) => (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => goCategory(cat.slug)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-all border ${
                        activeCategorySlug === cat.slug
                          ? 'bg-gradient-to-r from-orange-50 to-teal-50 border-orange-200'
                          : categoryBgColors[cat.slug] || 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-muted-foreground">{getCategoryIcon(cat.icon)}</span>
                      <span className="font-medium truncate text-xs">{cat.name}</span>
                    </motion.button>
                  ))}
                </div>
                <Button
                  onClick={() => {
                    handleListBusiness()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full mt-3 h-11 bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white font-semibold rounded-xl gap-2"
                >
                  <Plus className="h-4 w-4" />
                  List Your Business — It&apos;s Free
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AddBusinessModal
        categories={categories}
        open={addBusinessOpen}
        onOpenChange={setAddBusinessOpen}
        userName={session?.user?.name}
        userEmail={session?.user?.email}
      />
    </>
  )
}
