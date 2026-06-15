/**
 * Server-rendered internal links for the homepage.
 * Crawlers see category + featured business links on first paint even though
 * the interactive UI is client-hydrated above.
 */
import Link from 'next/link'
import { getHomepageLinkBundle } from '@/lib/seo/service'
import { categoryPath, listingPath } from '@/lib/seo/url'

export async function HomepageInternalLinks() {
  const { categories, featured } = await getHomepageLinkBundle()

  return (
    <nav
      aria-label="Directory navigation"
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:border focus:rounded-lg"
    >
      <section>
        <h2>Browse categories</h2>
        <ul>
          {categories.map(c => (
            <li key={c.slug}>
              <Link href={categoryPath(c.slug)}>{c.name}</Link>
            </li>
          ))}
        </ul>
      </section>
      {featured.length > 0 && (
        <section>
          <h2>Featured businesses</h2>
          <ul>
            {featured.map(l => (
              <li key={l.slug}>
                <Link href={listingPath(l.slug)}>{l.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </nav>
  )
}
