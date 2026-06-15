import type { Metadata } from 'next'
import { getSeoSettings } from './repository'
import { buildMetadata } from './metadata'

export async function staticPageMetadata(
  path: string,
  title: string,
  description: string,
): Promise<Metadata> {
  const seo = await getSeoSettings()
  return buildMetadata(seo, { title, description, path })
}

export async function noindexPageMetadata(title: string): Promise<Metadata> {
  const seo = await getSeoSettings()
  return buildMetadata(seo, {
    title,
    description: seo.defaultDescription,
    path: '/',
    noindex: true,
  })
}
