import { mkdir, readFile, stat, writeFile } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'
import { stripHtml } from '@/lib/blog/html'
import { getSeoSettings } from '@/lib/seo/repository'
import { listingUrl } from '@/lib/seo/url'

export type ListingsXmlStatus = {
  feedUrl: string
  fileExists: boolean
  listingCount: number
  generatedAt: string | null
  fileSize: number | null
  livePublishedCount: number
}

export function getListingsXmlFilePath(): string {
  return path.join(process.cwd(), 'public', 'listings.xml')
}

function parseListingsXmlMeta(xml: string): { listingCount: number; generatedAt: string | null } {
  const countMatch = xml.match(/count="(\d+)"/)
  const generatedMatch = xml.match(/generated="([^"]+)"/)
  return {
    listingCount: countMatch ? Number(countMatch[1]) : 0,
    generatedAt: generatedMatch?.[1] ?? null,
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function buildListingsXml(): Promise<string> {
  const seo = await getSeoSettings()
  const listings = await db.listing.findMany({
    where: { published: true },
    select: { name: true, slug: true, description: true },
    orderBy: { name: 'asc' },
  })

  const items = listings
    .map((listing) => {
      const link = listingUrl(listing.slug, seo.siteUrl)
      const description = stripHtml(listing.description).replace(/\s+/g, ' ').trim()
      return `  <listing>
    <name>${escapeXml(listing.name)}</name>
    <description>${escapeXml(description)}</description>
    <link>${escapeXml(link)}</link>
  </listing>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<listings count="${listings.length}" generated="${new Date().toISOString()}">
${items}
</listings>`
}

export async function writeListingsXmlFile(): Promise<{
  listingCount: number
  generatedAt: string
  filePath: string
  fileSize: number
}> {
  const xml = await buildListingsXml()
  const { listingCount, generatedAt } = parseListingsXmlMeta(xml)
  const filePath = getListingsXmlFilePath()
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, xml, 'utf8')
  const fileStat = await stat(filePath)

  return {
    listingCount,
    generatedAt: generatedAt ?? new Date().toISOString(),
    filePath,
    fileSize: fileStat.size,
  }
}

export async function getListingsXmlStatus(): Promise<ListingsXmlStatus> {
  const seo = await getSeoSettings()
  const feedUrl = `${seo.siteUrl.replace(/\/$/, '')}/listings.xml`
  const livePublishedCount = await db.listing.count({ where: { published: true } })

  try {
    const filePath = getListingsXmlFilePath()
    const fileStat = await stat(filePath)
    const xml = await readFile(filePath, 'utf8')
    const { listingCount, generatedAt } = parseListingsXmlMeta(xml)
    return {
      feedUrl,
      fileExists: true,
      listingCount,
      generatedAt: generatedAt ?? fileStat.mtime.toISOString(),
      fileSize: fileStat.size,
      livePublishedCount,
    }
  } catch {
    return {
      feedUrl,
      fileExists: false,
      listingCount: livePublishedCount,
      generatedAt: null,
      fileSize: null,
      livePublishedCount,
    }
  }
}
