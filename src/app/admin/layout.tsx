'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Building2,
  FileText,
  Star,
  FolderOpen,
  Megaphone,
  Code2,
  Search as SearchIcon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Newspaper,
  Users,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NavChild = { href: string; label: string }

type NavItem = {
  href?: string
  label: string
  icon: LucideIcon
  children?: NavChild[]
}

const navItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  {
    label: 'Listings',
    icon: Building2,
    children: [
      { href: '/admin/listings', label: 'All Listings' },
      { href: '/admin/listings/drafts', label: 'Listing Drafts' },
    ],
  },
  { href: '/admin/submissions', label: 'Submissions', icon: FileText },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  {
    label: 'Blog',
    icon: Newspaper,
    children: [
      { href: '/admin/blog', label: 'Posts' },
      { href: '/admin/blog/categories', label: 'Categories' },
    ],
  },
  { href: '/admin/ads', label: 'Ads', icon: Megaphone },
  { href: '/admin/pixels', label: 'Pixels', icon: Code2 },
  { href: '/admin/seo', label: 'SEO', icon: SearchIcon },
  { href: '/admin/settings', label: 'App Settings', icon: Settings },
]

function isBlogPath(pathname: string) {
  return pathname === '/admin/blog' || pathname.startsWith('/admin/blog/')
}

function isListingsPath(pathname: string) {
  return pathname === '/admin/listings' || pathname.startsWith('/admin/listings/')
}

function isNavItemActive(pathname: string, item: NavItem) {
  if (item.children) {
    if (item.label === 'Blog') return isBlogPath(pathname)
    if (item.label === 'Listings') return isListingsPath(pathname)
    return false
  }
  return pathname === item.href || (item.href !== '/admin' && !!item.href && pathname.startsWith(item.href))
}

function isNavChildActive(pathname: string, child: NavChild) {
  if (child.href === '/admin/blog') {
    return pathname === '/admin/blog' || (pathname.startsWith('/admin/blog/') && !pathname.startsWith('/admin/blog/categories'))
  }
  if (child.href === '/admin/listings') {
    return pathname === '/admin/listings'
  }
  if (child.href === '/admin/listings/drafts') {
    return pathname === '/admin/listings/drafts'
  }
  return pathname === child.href || pathname.startsWith(`${child.href}/`)
}

function SidebarNav({ pathname, collapsed, onNavigate }: { pathname: string; collapsed: boolean; onNavigate?: () => void }) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('p-4 border-b border-white/10', collapsed && 'px-3')}>
        <Link href="/admin" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-orange-400 to-teal-400 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-white leading-tight">Agadir Admin</h1>
              <p className="text-[10px] text-white/50">City Directory</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          if (item.children) {
            const groupActive =
              item.label === 'Blog'
                ? isBlogPath(pathname)
                : item.label === 'Listings'
                  ? isListingsPath(pathname)
                  : false
            if (collapsed) {
              return (
                <Link
                  key={item.label}
                  href={item.children[0].href}
                  onClick={onNavigate}
                  title={item.label}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                    groupActive
                      ? 'bg-white/15 text-white font-medium'
                      : 'text-white/60 hover:text-white hover:bg-white/8',
                  )}
                >
                  <item.icon className={cn('h-4.5 w-4.5 flex-shrink-0', groupActive && 'text-orange-300')} />
                </Link>
              )
            }

            return (
              <div key={item.label} className="space-y-1">
                <div
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wide',
                    groupActive ? 'text-orange-300' : 'text-white/40',
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
                {item.children.map((child) => {
                  const childActive = isNavChildActive(pathname, child)
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-3 pl-9 pr-3 py-2 rounded-lg text-sm transition-all duration-200',
                        childActive
                          ? 'bg-white/15 text-white font-medium'
                          : 'text-white/60 hover:text-white hover:bg-white/8',
                      )}
                    >
                      <span className="flex-1">{child.label}</span>
                      {childActive && <ChevronRight className="h-3.5 w-3.5 text-white/40" />}
                    </Link>
                  )
                })}
              </div>
            )
          }

          const isActive = isNavItemActive(pathname, item)
          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                isActive
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              )}
            >
              <item.icon className={cn('h-4.5 w-4.5 flex-shrink-0', isActive && 'text-orange-300')} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/40" />}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/8 transition-all',
            collapsed && 'justify-center'
          )}
        >
          <Building2 className="h-4.5 w-4.5 flex-shrink-0" />
          {!collapsed && <span>View Site</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-red-300 hover:bg-red-500/10 transition-all w-full mt-1',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthed, setIsAuthed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (pathname === '/admin/login') {
      setIsLoading(true)
      fetch('/api/admin/stats')
        .then((res) => {
          if (res.ok) {
            router.replace('/admin')
          }
        })
        .catch(() => {
          // Stay on login page
        })
        .finally(() => setIsLoading(false))
      return
    }

    // Check auth for all other admin routes
    setIsLoading(true)
    fetch('/api/admin/stats')
      .then(res => {
        if (res.status === 401) {
          setIsAuthed(false)
          router.push('/admin/login')
        } else {
          setIsAuthed(true)
        }
      })
      .catch(() => {
        setIsAuthed(false)
        router.push('/admin/login')
      })
      .finally(() => setIsLoading(false))
  }, [router, pathname])

  // Login page doesn't need the sidebar
  if (pathname === '/admin/login') {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="w-10 h-10 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAuthed) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar — fixed so it stays visible while scrolling */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white transition-all duration-300 overflow-y-auto',
          sidebarCollapsed ? 'w-[68px]' : 'w-60'
        )}
      >
        <SidebarNav pathname={pathname} collapsed={sidebarCollapsed} />
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute top-5 -right-3 z-50 w-6 h-6 items-center justify-center rounded-full bg-white shadow-md border text-gray-500 hover:text-gray-700 transition-colors flex"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronRight className={cn('h-3 w-3 transition-transform', !sidebarCollapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white z-50">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="text-sm font-bold text-white">Menu</span>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>
            <SidebarNav pathname={pathname} collapsed={false} onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content — offset by fixed sidebar width */}
      <main
        className={cn(
          'min-w-0 transition-[margin] duration-300',
          sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-60',
        )}
      >
        {/* Top bar for mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-400 to-teal-400 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">Agadir Admin</span>
          </div>
        </header>
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
