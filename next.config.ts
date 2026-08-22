import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false, // drop the x-powered-by: Next.js fingerprint
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "www.visitagadir.info" },
      { protocol: "https", hostname: "visitagadir.info" },
    ],
  },
  // 301 redirects for the legacy WordPress URL structure. Generated at build
  // time from the DB so old permalinks (and external backlinks) resolve to the
  // current routes instead of 404ing. Fixes Screaming Frog "Internal 4xx" and
  // preserves link equity. Falls back to no redirects if the DB is unreachable
  // at build (e.g. a fresh clone) so the build never breaks.
  async redirects() {
    const RESERVED = new Set([
      'about', 'contact', 'blog', 'login', 'signup', 'privacy', 'terms',
      'advertise', 'my-listings', 'admin', 'api', 'category', 'city', 'listing',
      'sitemap.xml', 'robots.txt', 'ads.txt', 'listings.xml', '_next', 'uploads',
      'listings', 'favicon.ico',
    ])
    // Old WP "listing-category" slugs → current category slugs.
    const CATEGORY_MAP: Record<string, string> = {
      'health-care': 'health-wellness',
      'entertainment': 'nightlife-entertainment',
      'food-restaurants': 'restaurants-cafes',
      'travel-tour': 'tours-excursions',
      'accommodation': 'hotels-accommodation',
      'sport': 'beaches-water-sports',
    }

    try {
      const { PrismaClient } = await import('@prisma/client')
      const db = new PrismaClient()
      const posts = await db.blogPost.findMany({ select: { slug: true } })
      await db.$disconnect()

      const redirects = [
        // Legacy blog permalinks lived at the site root (/<slug>); now under /blog/.
        ...posts
          .filter((p) => !RESERVED.has(p.slug))
          .map((p) => ({
            source: `/${p.slug}`,
            destination: `/blog/${p.slug}`,
            statusCode: 301,
          })),
        // WP used /job/ for business listings.
        { source: '/job/:slug*', destination: '/listing/:slug*', statusCode: 301 },
        // WP taxonomy pages we no longer have — send to the homepage.
        { source: '/region/:slug*', destination: '/', statusCode: 301 },
        { source: '/wp-admin/:path*', destination: '/', statusCode: 301 },
        // Mapped listing-category taxonomy → current category pages.
        ...Object.entries(CATEGORY_MAP).map(([from, to]) => ({
          source: `/listing-category/${from}`,
          destination: `/category/${to}`,
          statusCode: 301,
        })),
      ]
      return redirects
    } catch {
      return []
    }
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
