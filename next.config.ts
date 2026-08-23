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

    // Specific legacy listings that were re-slugged (old slug → current slug).
    const RESLUGGED_LISTINGS: Record<string, string> = {
      'akdital-agadir-hopital-international-dagadir': 'akdital-agadir-international-hospital-of-agadir',
    }

    // Tier C consolidation: duplicate blog posts merged into a pillar. The dup
    // is unpublished; this 301s its old URL to the pillar so equity consolidates.
    const BLOG_CONSOLIDATION: Record<string, string> = {
      'best-restaurants-in-agadir-2': 'best-restaurants-in-agadir',
      'best-agadir-restaurants-for-every-mood': 'best-restaurants-in-agadir',
      'savoring-agadir-a-culinary-journey-through-traditional-moroccan-cuisine': 'best-restaurants-in-agadir',
      'savoring-the-best-of-agadir-a-guide-to-the-citys-finest-restaurant-lounges': 'best-restaurants-in-agadir',
      'best-agadir-surf-spots-for-beginners': 'the-ultimate-guide-to-agadirs-best-surf-spots-for-beginners',
      'riding-the-waves-in-agadir-a-guide-to-the-best-surfing-spots': 'the-ultimate-guide-to-agadirs-best-surf-spots-for-beginners',
      'agadir-beach-clubs-guide': 'agadir-beach-clubs-review-where-to-go',
      'exploring-the-lush-greens-agadirs-top-golf-courses': 'agadir-golf-courses',
      'places-to-work-agadir': 'best-cafes-for-remote-work-in-agadir',
    }

    try {
      const { PrismaClient } = await import('@prisma/client')
      const db = new PrismaClient()
      const [posts, listings] = await Promise.all([
        db.blogPost.findMany({ select: { slug: true } }),
        db.listing.findMany({ where: { published: true }, select: { slug: true } }),
      ])
      await db.$disconnect()

      const blogSlugs = new Set(posts.map((p) => p.slug))

      const redirects = [
        // Legacy blog permalinks lived at the site root (/<slug>); now under /blog/.
        ...posts
          .filter((p) => !RESERVED.has(p.slug))
          .map((p) => ({
            source: `/${p.slug}`,
            destination: `/blog/${p.slug}`,
            statusCode: 301,
          })),
        // Legacy listing permalinks also lived at the site root; now under /listing/.
        // (Blog takes precedence for any shared slug.)
        ...listings
          .filter((l) => !RESERVED.has(l.slug) && !blogSlugs.has(l.slug))
          .map((l) => ({
            source: `/${l.slug}`,
            destination: `/listing/${l.slug}`,
            statusCode: 301,
          })),
        // Re-slugged listings (old /listing/<old> → /listing/<current>).
        ...Object.entries(RESLUGGED_LISTINGS).map(([from, to]) => ({
          source: `/listing/${from}`,
          destination: `/listing/${to}`,
          statusCode: 301,
        })),
        // Consolidated duplicate blog posts → their pillar.
        ...Object.entries(BLOG_CONSOLIDATION).map(([from, to]) => ({
          source: `/blog/${from}`,
          destination: `/blog/${to}`,
          statusCode: 301,
        })),
        // Dead AFCON-2025 topical sub-pages that were never published as posts →
        // consolidate to the main AFCON guide. Real AFCON posts already redirect
        // to their own /blog/ page above (matched first).
        { source: '/afcon-2025-:rest', destination: '/blog/afcon-2025-agadir-guide', statusCode: 301 },
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
        // Catch-all: any other old /listing-category/* slug we didn't map has no
        // current equivalent — 301 to the homepage instead of 404ing (matches
        // the /region/* treatment). Listed AFTER the specific maps above so the
        // mapped slugs win (Next.js matches redirects in array order).
        { source: '/listing-category/:slug*', destination: '/', statusCode: 301 },
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
