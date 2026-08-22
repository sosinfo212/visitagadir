/**
 * Null listing seoTitle where it merely equals the business name (imported from
 * WordPress). Such an override adds nothing and blocks the CTR-optimized title
 * fallback (name + city + Reviews/Menu/Hours hook). Genuinely custom seoTitles
 * (different from the name) are left untouched.
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const DRY = process.argv.includes('--dry')

const rows = await prisma.listing.findMany({
  where: { seoTitle: { not: null } },
  select: { id: true, name: true, seoTitle: true },
})
const redundant = rows.filter((r) => (r.seoTitle ?? '').trim() === (r.name ?? '').trim())

console.log(`${DRY ? 'DRY-RUN' : 'APPLY'}: ${redundant.length} listings with seoTitle == name`)
if (!DRY) {
  const res = await prisma.listing.updateMany({
    where: { id: { in: redundant.map((r) => r.id) } },
    data: { seoTitle: null },
  })
  console.log(`Nulled seoTitle on ${res.count} listings.`)
}
await prisma.$disconnect()
