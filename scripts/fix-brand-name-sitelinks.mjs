/**
 * Sitelinks / brand-name consolidation.
 *
 * Google shows ONE site name in results and draws sitelink labels from a clean,
 * consistent brand. The site was using the title-style string
 * "Visit Agadir | Agadir Directory" as its name across schema + OG. Collapse it
 * to a single brand "Visit Agadir" everywhere; "Agadir Directory" survives as
 * schema alternateName (set in code: src/lib/seo/schema.ts).
 *
 * Run on the server:  node scripts/fix-brand-name-sitelinks.mjs
 * Idempotent — safe to re-run.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const BRAND = 'Visit Agadir'

async function main() {
  const seo = await db.seoSettings.updateMany({
    data: { siteName: BRAND, titleTemplate: `%s | ${BRAND}` },
  })
  const schema = await db.schemaSettings.updateMany({
    data: {
      organizationName: BRAND,
      // NAP into Organization JSON-LD (buildOrganizationSchema emits these).
      email: 'contact@visitagadir.info',
      phone: '+212 619-267125',
    },
  })
  const app = await db.appSettings.updateMany({
    data: { siteName: BRAND },
  })

  console.log('Updated rows:', {
    seoSettings: seo.count,
    schemaSettings: schema.count,
    appSettings: app.count,
  })

  // Echo back the resulting values for verification.
  const [s, sc, a] = await Promise.all([
    db.seoSettings.findFirst({ select: { siteName: true, titleTemplate: true } }),
    db.schemaSettings.findFirst({ select: { organizationName: true } }),
    db.appSettings.findFirst({ select: { siteName: true } }),
  ])
  console.log('Now:', { seo: s, schema: sc, app: a })
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
