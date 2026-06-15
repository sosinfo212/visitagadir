import { db } from '@/lib/db'
import { ensureDefaultBlogCategories } from '@/lib/blog/ensure-categories'
import { slugify, isValidSlug } from '@/lib/blog/slug'
import { extractMediaUrls, MediaImporter, rewriteMediaUrls } from '@/lib/blog/import-media'
import { parseWordPressXml, type WpItem } from '@/lib/blog/wordpress-parser'

export interface WordPressImportOptions {
  skipExisting?: boolean
  includeDrafts?: boolean
}

export interface WordPressImportResult {
  postsImported: number
  postsSkipped: number
  postsFailed: number
  categoriesCreated: number
  mediaDownloaded: number
  mediaFailed: number
  errors: string[]
}

function parsePublishedAt(item: WpItem): Date | null {
  const raw = item.postDateGmt || item.pubDate
  if (!raw) return null
  const d = new Date(raw.includes('T') ? raw : `${raw.replace(' ', 'T')}Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

function pickPostCategory(item: WpItem) {
  const wpCat = item.categories.find((c) => c.domain === 'category')
  if (!wpCat) return null
  const slug = wpCat.nicename || slugify(wpCat.name)
  if (!isValidSlug(slug)) return null
  return { name: wpCat.name || slug, slug }
}

async function ensureCategory(
  categoryRef: { name: string; slug: string } | null,
  created: Set<string>,
): Promise<string> {
  await ensureDefaultBlogCategories()

  if (!categoryRef) {
    const fallback = await db.blogCategory.findUnique({ where: { slug: 'travel-guides' } })
    if (fallback) return fallback.id
    const first = await db.blogCategory.findFirst({ orderBy: { name: 'asc' } })
    if (!first) throw new Error('No blog categories available.')
    return first.id
  }

  const existing = await db.blogCategory.findUnique({ where: { slug: categoryRef.slug } })
  if (existing) return existing.id

  const createdCat = await db.blogCategory.create({
    data: {
      name: categoryRef.name,
      slug: categoryRef.slug,
      description: `Imported from WordPress (${categoryRef.slug})`,
    },
  })
  created.add(categoryRef.slug)
  return createdCat.id
}

function collectUrlsForPost(
  post: WpItem,
  attachmentById: Map<string, string>,
  siteUrl: string,
): string[] {
  const urls = new Set<string>()

  const thumbId = post.meta.get('_thumbnail_id')
  if (thumbId) {
    const thumbUrl = attachmentById.get(thumbId)
    if (thumbUrl) urls.add(thumbUrl)
  }

  for (const url of extractMediaUrls(post.content, siteUrl)) urls.add(url)
  if (post.excerpt) {
    for (const url of extractMediaUrls(post.excerpt, siteUrl)) urls.add(url)
  }

  return [...urls]
}

export async function importWordPressExport(
  xml: string,
  options: WordPressImportOptions = {},
): Promise<WordPressImportResult> {
  const skipExisting = options.skipExisting !== false
  const includeDrafts = options.includeDrafts === true

  const result: WordPressImportResult = {
    postsImported: 0,
    postsSkipped: 0,
    postsFailed: 0,
    categoriesCreated: 0,
    mediaDownloaded: 0,
    mediaFailed: 0,
    errors: [],
  }

  const parsed = parseWordPressXml(xml)
  const attachmentById = new Map<string, string>()
  for (const att of parsed.attachments) {
    if (att.postId && att.attachmentUrl) {
      attachmentById.set(att.postId, att.attachmentUrl)
    }
  }

  const postsToImport = parsed.posts.filter((post) => {
    if (post.postType !== 'post') return false
    if (post.status === 'publish') return true
    if (includeDrafts && (post.status === 'draft' || post.status === 'pending')) return true
    return false
  })

  const mediaImporter = new MediaImporter()

  const allUrls = new Set<string>()
  for (const att of parsed.attachments) {
    if (att.attachmentUrl) allUrls.add(att.attachmentUrl)
  }
  for (const post of postsToImport) {
    for (const url of collectUrlsForPost(post, attachmentById, parsed.siteUrl)) {
      allUrls.add(url)
    }
  }

  await mediaImporter.importMany([...allUrls])
  const urlMap = mediaImporter.getStats().cache
  result.mediaDownloaded = mediaImporter.getStats().downloaded
  result.mediaFailed = mediaImporter.getStats().failed

  const createdCategories = new Set<string>()

  for (const post of postsToImport) {
    try {
      let slug = post.slug?.trim()
      if (!slug || !isValidSlug(slug)) {
        slug = slugify(post.title || '')
      }
      if (!slug || !isValidSlug(slug)) {
        result.postsFailed += 1
        result.errors.push(`Skipped "${post.title}": invalid slug.`)
        continue
      }

      const existing = await db.blogPost.findUnique({ where: { slug } })
      if (existing && skipExisting) {
        result.postsSkipped += 1
        continue
      }

      const categoryId = await ensureCategory(pickPostCategory(post), createdCategories)
      const content = rewriteMediaUrls(post.content || '<p></p>', urlMap)

      let coverImage: string | null = null
      const thumbId = post.meta.get('_thumbnail_id')
      if (thumbId) {
        const remoteThumb = attachmentById.get(thumbId)
        if (remoteThumb) coverImage = urlMap.get(remoteThumb) ?? null
      }
      if (!coverImage) {
        const firstRemote = extractMediaUrls(post.content || '', parsed.siteUrl)[0]
        if (firstRemote) coverImage = urlMap.get(firstRemote) ?? null
      }

      const status = post.status === 'publish' ? 'published' : 'draft'
      const publishedAt = status === 'published' ? parsePublishedAt(post) : null
      const excerpt =
        post.excerpt?.trim() ||
        post.meta.get('_aioseo_description')?.trim() ||
        content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 280) ||
        null

      const data = {
        title: post.title.trim() || slug,
        slug,
        content,
        excerpt,
        coverImage,
        authorName: post.author?.trim() || 'Visit Agadir',
        status,
        publishedAt: status === 'published' ? publishedAt ?? new Date() : null,
        categoryId,
        seoTitle: post.meta.get('_aioseo_title')?.trim() || null,
        metaDescription: post.meta.get('_aioseo_description')?.trim() || excerpt,
        primaryKeywords: post.meta.get('_aioseo_keywords')?.trim() || null,
        canonicalUrl: post.link?.trim() || null,
      }

      if (existing) {
        await db.blogPost.update({ where: { id: existing.id }, data })
      } else {
        await db.blogPost.create({ data })
      }

      result.postsImported += 1
    } catch (error) {
      result.postsFailed += 1
      const message = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(`Failed "${post.title}": ${message}`)
    }
  }

  result.categoriesCreated = createdCategories.size
  if (result.errors.length > 20) {
    result.errors = [
      ...result.errors.slice(0, 20),
      `…and ${result.errors.length - 20} more errors`,
    ]
  }

  return result
}
