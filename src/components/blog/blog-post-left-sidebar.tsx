'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Check, Clock, Copy, Facebook, Link2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TocItem } from '@/lib/blog/toc'
import { blogCategoryPath, blogPath } from '@/lib/seo/url'
import { cn } from '@/lib/utils'

interface BlogPostLeftSidebarProps {
  toc: TocItem[]
  readTimeMinutes: number
  category: { name: string; slug: string } | null
  shareTitle: string
  variant?: 'desktop' | 'mobile'
}

function BlogPostShare({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    setShareUrl(window.location.href)
  }, [])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }, [shareUrl])

  const whatsappUrl = shareUrl
    ? `https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`
    : '#'
  const facebookUrl = shareUrl
    ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    : '#'

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1.5" onClick={copyLink}>
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </Button>
      <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1.5" asChild>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>
      </Button>
      <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1.5" asChild>
        <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
          <Facebook className="h-3.5 w-3.5" />
          Share
        </a>
      </Button>
    </div>
  )
}

function TocNav({ items, activeId }: { items: TocItem[]; activeId: string | null }) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Table of contents">
      <ul className="space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                'block py-1.5 px-2 rounded-lg transition-colors leading-snug',
                item.level === 3 && 'pl-4 text-xs',
                activeId === item.id
                  ? 'bg-orange-50 text-orange-700 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function BlogPostLeftSidebar({
  toc,
  readTimeMinutes,
  category,
  shareTitle,
  variant = 'desktop',
}: BlogPostLeftSidebarProps) {
  const [activeId, setActiveId] = useState<string | null>(toc[0]?.id ?? null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (toc.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    )

    for (const item of toc) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [toc])

  if (variant === 'mobile') {
    return (
      <div className="xl:hidden mb-6 space-y-4">
        {toc.length > 0 && (
          <Card className="shadow-sm border-orange-100">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setMobileOpen((o) => !o)}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <BookOpen className="h-4 w-4 text-orange-500" />
                In this article ({toc.length})
              </span>
              <span className="text-xs text-muted-foreground">{mobileOpen ? 'Hide' : 'Show'}</span>
            </button>
            {mobileOpen && (
              <CardContent className="pt-0 pb-4 px-4">
                <TocNav items={toc} activeId={activeId} />
              </CardContent>
            )}
          </Card>
        )}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Share this article</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <BlogPostShare title={shareTitle} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Card className="shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            {readTimeMinutes} min read
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3 text-sm">
          <Link href={blogPath()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Link2 className="h-3.5 w-3.5" />
            All blog posts
          </Link>
          {category && (
            <Link
              href={blogCategoryPath(category.slug)}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              {category.name}
            </Link>
          )}
        </CardContent>
      </Card>

      {toc.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">On this page</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <TocNav items={toc} activeId={activeId} />
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">Share</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <BlogPostShare title={shareTitle} />
        </CardContent>
      </Card>
    </div>
  )
}
