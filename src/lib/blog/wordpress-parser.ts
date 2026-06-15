function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
}

function getTagValue(block: string, tag: string): string {
  const escaped = tag.replace(':', '\\:')
  const cdata = new RegExp(`<${escaped}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${escaped}>`)
  const plain = new RegExp(`<${escaped}>([\\s\\S]*?)<\\/${escaped}>`)

  const cdataMatch = block.match(cdata)
  if (cdataMatch) return cdataMatch[1]

  const plainMatch = block.match(plain)
  if (plainMatch) return decodeXmlEntities(plainMatch[1].trim())

  return ''
}

export interface WpCategoryRef {
  domain: string
  nicename: string
  name: string
}

export interface WpItem {
  title: string
  content: string
  excerpt: string
  slug: string
  status: string
  postType: string
  postId: string
  postDateGmt: string
  pubDate: string
  author: string
  link: string
  categories: WpCategoryRef[]
  meta: Map<string, string>
  attachmentUrl?: string
}

export interface ParsedWordPressExport {
  siteUrl: string
  items: WpItem[]
  posts: WpItem[]
  listings: WpItem[]
  attachments: WpItem[]
}

function parseCategories(itemXml: string): WpCategoryRef[] {
  const categories: WpCategoryRef[] = []
  const re =
    /<category domain="([^"]+)" nicename="([^"]+)">(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/category>/g

  for (const match of itemXml.matchAll(re)) {
    categories.push({
      domain: match[1],
      nicename: match[2],
      name: decodeXmlEntities((match[3] || match[4] || '').trim()),
    })
  }

  return categories
}

function parsePostMeta(itemXml: string): Map<string, string> {
  const meta = new Map<string, string>()
  const blocks = itemXml.match(/<wp:postmeta>[\s\S]*?<\/wp:postmeta>/g) || []

  for (const block of blocks) {
    const key = getTagValue(block, 'wp:meta_key')
    if (!key) continue
    meta.set(key, getTagValue(block, 'wp:meta_value'))
  }

  return meta
}

function parseItem(itemXml: string): WpItem {
  const postType = getTagValue(itemXml, 'wp:post_type')
  const attachmentUrl = getTagValue(itemXml, 'wp:attachment_url') || undefined

  return {
    title: getTagValue(itemXml, 'title'),
    content: getTagValue(itemXml, 'content:encoded'),
    excerpt: getTagValue(itemXml, 'excerpt:encoded'),
    slug: getTagValue(itemXml, 'wp:post_name'),
    status: getTagValue(itemXml, 'wp:status'),
    postType,
    postId: getTagValue(itemXml, 'wp:post_id'),
    postDateGmt: getTagValue(itemXml, 'wp:post_date_gmt'),
    pubDate: getTagValue(itemXml, 'pubDate'),
    author: getTagValue(itemXml, 'dc:creator'),
    link: getTagValue(itemXml, 'link'),
    categories: parseCategories(itemXml),
    meta: parsePostMeta(itemXml),
    attachmentUrl,
  }
}

export function parseWordPressXml(xml: string): ParsedWordPressExport {
  const siteUrl = getTagValue(xml, 'wp:base_site_url') || getTagValue(xml, 'link') || ''

  const itemChunks = xml.split('<item>').slice(1).map((chunk) => chunk.split('</item>')[0])
  const items = itemChunks.map(parseItem)

  return {
    siteUrl,
    items,
    posts: items.filter((i) => i.postType === 'post'),
    listings: items.filter((i) => i.postType === 'job_listing'),
    attachments: items.filter((i) => i.postType === 'attachment'),
  }
}
