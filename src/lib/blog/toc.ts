import { isHtmlContent, stripHtml } from '@/lib/blog/html'

export interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function uniqueId(base: string, usedIds: Set<string>): string {
  let id = base || 'section'
  let suffix = 0
  while (usedIds.has(id)) {
    suffix += 1
    id = `${base}-${suffix}`
  }
  usedIds.add(id)
  return id
}

/**
 * Ensure every `<img>` in content HTML has descriptive alt text. Imported
 * (e.g. WordPress) content frequently ships images with an empty or missing
 * alt attribute — flagged by crawlers as "missing alt text". When no usable
 * alt is present we fall back to the post title so the image still describes
 * the page it lives on.
 */
function injectImgAlt(html: string, fallback?: string): string {
  const safe = (fallback ?? '').trim().replace(/"/g, '&quot;')
  if (!safe) return html
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const m = /\balt\s*=\s*("([^"]*)"|'([^']*)')/i.exec(tag)
    if (m) {
      const val = (m[2] ?? m[3] ?? '').trim()
      if (val) return tag // already has descriptive alt
      return tag.replace(/\balt\s*=\s*("[^"]*"|'[^']*')/i, `alt="${safe}"`)
    }
    return tag.replace(/<img\b/i, `<img alt="${safe}"`)
  })
}

/** Extract h2/h3 headings for TOC and inject anchor ids into HTML content. */
export function prepareBlogContent(
  content: string,
  fallbackImgAlt?: string,
): { items: TocItem[]; html: string } {
  const items: TocItem[] = []
  const usedIds = new Set<string>()

  if (isHtmlContent(content)) {
    const withIds = content.replace(
      /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi,
      (match, levelStr, attrs = '', inner) => {
        const text = stripHtml(inner)
        if (!text) return match

        const level = Number(levelStr) as 2 | 3
        const id = uniqueId(slugifyHeading(text), usedIds)
        items.push({ id, text, level })

        if (/\bid\s*=/i.test(attrs)) return match
        return `<h${level}${attrs} id="${id}">${inner}</h${level}>`
      },
    )
    return { items, html: injectImgAlt(withIds, fallbackImgAlt) }
  }

  const lines = content.split('\n')
  const htmlParts: string[] = []
  let paragraph: string[] = []

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    const text = paragraph.join('\n').trim()
    if (text) {
      htmlParts.push(`<p>${text.replace(/\n/g, '<br />')}</p>`)
    }
    paragraph = []
  }

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/)
    const h3 = line.match(/^###\s+(.+)$/)
    if (h2 || h3) {
      flushParagraph()
      const text = (h2 || h3)![1].trim()
      const level = h2 ? 2 : 3
      const id = uniqueId(slugifyHeading(text), usedIds)
      items.push({ id, text, level: level as 2 | 3 })
      htmlParts.push(`<h${level} id="${id}">${text}</h${level}>`)
      continue
    }
    if (!line.trim()) {
      flushParagraph()
      continue
    }
    paragraph.push(line)
  }
  flushParagraph()

  return { items, html: injectImgAlt(htmlParts.join('\n'), fallbackImgAlt) }
}

export function estimateReadTimeMinutes(content: string): number {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}
