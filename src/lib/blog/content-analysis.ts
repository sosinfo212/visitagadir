import { stripHtml } from './html'

export interface ParsedImage {
  src: string
  alt: string
}

export interface ParsedContent {
  headings: string[]
  h2Headings: string[]
  images: ParsedImage[]
  internalLinks: string[]
  externalLinks: string[]
  plainText: string
  wordCount: number
  hasBulletList: boolean
  hasFaqSection: boolean
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#?\w+;/g, ' ')
}

function extractAttr(tag: string, name: string): string {
  const match = tag.match(new RegExp(`${name}=["']([^"']*)["']`, 'i'))
  return match?.[1] ?? ''
}

function isInternalHref(href: string): boolean {
  const h = href.trim()
  if (!h || h.startsWith('#') || h.startsWith('mailto:') || h.startsWith('tel:')) return false
  if (h.startsWith('/')) return true
  if (!/^https?:\/\//i.test(h)) return true
  return false
}

function isExternalHref(href: string): boolean {
  const h = href.trim()
  return /^https?:\/\//i.test(h)
}

export function parseBlogContent(html: string): ParsedContent {
  const headings: string[] = []
  const h2Headings: string[] = []
  const images: ParsedImage[] = []
  const internalLinks: string[] = []
  const externalLinks: string[] = []

  for (const match of html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const text = decodeHtmlEntities(stripHtml(match[2])).trim()
    if (!text) continue
    headings.push(text)
    if (match[1] === '2') h2Headings.push(text)
  }

  for (const match of html.matchAll(/<img[^>]*>/gi)) {
    images.push({
      src: extractAttr(match[0], 'src'),
      alt: extractAttr(match[0], 'alt').trim(),
    })
  }

  for (const match of html.matchAll(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi)) {
    const href = match[1]
    if (isInternalHref(href)) internalLinks.push(href)
    if (isExternalHref(href)) externalLinks.push(href)
  }

  const plainText = stripHtml(html)
  const wordCount = plainText.split(/\s+/).filter(Boolean).length
  const hasBulletList = /<(ul|ol)\b/i.test(html)
  const hasFaqSection =
    /<(h[2-4])[^>]*>[^<]*(faq|frequently asked)[^<]*<\/\1>/i.test(html) ||
    (h2Headings.some((h) => /faq|frequently asked/i.test(h)) &&
      (/<li[^>]*>[^<]*\?/i.test(html) || h2Headings.filter((h) => h.includes('?')).length >= 2))

  return {
    headings,
    h2Headings,
    images,
    internalLinks,
    externalLinks,
    plainText,
    wordCount,
    hasBulletList,
    hasFaqSection,
  }
}

export function averageParagraphLength(html: string): number {
  const paragraphs = html
    .split(/<\/p>/i)
    .map((chunk) => stripHtml(chunk.replace(/<p[^>]*>/i, '')).trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    const words = stripHtml(html).split(/\s+/).filter(Boolean)
    return words.length
  }

  const total = paragraphs.reduce((sum, p) => sum + p.split(/\s+/).filter(Boolean).length, 0)
  return total / paragraphs.length
}

export function averageSentenceLength(text: string): number {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (sentences.length === 0) return 0

  const total = sentences.reduce((sum, s) => sum + s.split(/\s+/).filter(Boolean).length, 0)
  return total / sentences.length
}

export function firstNWords(text: string, n: number): string {
  return text.split(/\s+/).filter(Boolean).slice(0, n).join(' ')
}
