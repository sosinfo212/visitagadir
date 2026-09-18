/**
 * Fix Bucket-A junk from scan-meta-integrity: null test/template seoTitle &
 * metaDescription so the CTR title template + thin-content fallback regenerate
 * correct values. Idempotent. Rebuild after.
 */
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

// slug -> fields to null (only the junk ones)
const FIX = {
  'sofitel-agadir-royal-bay': { seoTitle: null, metaDescription: null },
  'healthy-food': { seoTitle: null },
}

async function main() {
  for (const [slug, data] of Object.entries(FIX)) {
    const row = await db.listing.findUnique({ where: { slug }, select: { name: true } })
    if (!row) { console.log(`SKIP (not found): ${slug}`); continue }
    await db.listing.update({ where: { slug }, data })
    console.log(`OK  ${slug} (${row.name}) → nulled: ${Object.keys(data).join(', ')}`)
  }
  console.log('\nDone. Rebuild: bash scripts/safe-deploy.sh')
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>db.$disconnect())
