/**
 * One-off: replace the placeholder description on the "ideas" blog category.
 * The imported value "Imported from WordPress (ideas)" was showing as the page
 * subtitle and as the meta/og/twitter description on /blog/category/ideas.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SLUG = 'ideas'
const NEW_DESCRIPTION =
  'Travel ideas and inspiration for exploring Agadir, Morocco — things to do, day trips, and local tips to help you plan your visit.'

const before = await prisma.blogCategory.findUnique({ where: { slug: SLUG }, select: { name: true, description: true } })
console.log('BEFORE:', JSON.stringify(before))

if (before) {
  const updated = await prisma.blogCategory.update({
    where: { slug: SLUG },
    data: { description: NEW_DESCRIPTION },
    select: { name: true, description: true },
  })
  console.log('AFTER: ', JSON.stringify(updated))
} else {
  console.log('No category with slug', SLUG)
}

await prisma.$disconnect()
