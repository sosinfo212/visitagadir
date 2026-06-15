import { db } from '@/lib/db'
import { stripHtml } from '@/lib/blog/html'
import { getSeoSettings } from '@/lib/seo/repository'
import { listingUrl } from '@/lib/seo/url'

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
