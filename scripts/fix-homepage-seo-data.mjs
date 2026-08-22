/**
 * Homepage audit fixes — data only.
 * H2: Organization schema placeholders (localhost URL, fake email/phone/street,
 *     stub sameAs). Keep real name/logo/city/region/country.
 * L1: twitter handle placeholder @agadirtest.
 * M2: weak homepage title + meta description.
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// ── SchemaSettings (Organization JSON-LD) ──
const schema = await prisma.schemaSettings.findFirst({ orderBy: { createdAt: 'asc' } })
if (schema) {
  console.log('SchemaSettings BEFORE:', JSON.stringify({
    websiteUrl: schema.websiteUrl, phone: schema.phone, email: schema.email,
    streetAddress: schema.streetAddress, postalCode: schema.postalCode,
    socialProfiles: schema.socialProfiles,
  }))
  await prisma.schemaSettings.update({
    where: { id: schema.id },
    data: {
      websiteUrl: 'https://visitagadir.info',
      phone: null,
      email: null,
      streetAddress: null,   // fake seed "12 Avenue Hassan II"
      postalCode: null,
      socialProfiles: null,  // clear fake /agadir sameAs (empty > fake for E-E-A-T)
      // kept: organizationName, logoUrl, addressLocality (Agadir), addressRegion (Souss-Massa), country (MA)
    },
  })
  console.log('SchemaSettings updated: websiteUrl=https://visitagadir.info, phone/email/street/postalCode/socialProfiles cleared\n')
} else {
  console.log('No SchemaSettings row!\n')
}

// ── SeoSettings (title, description, twitter) ──
const seo = await prisma.seoSettings.findFirst({ orderBy: { createdAt: 'asc' } })
if (seo) {
  console.log('SeoSettings BEFORE:', JSON.stringify({
    defaultTitle: seo.defaultTitle, defaultDescription: seo.defaultDescription, twitterHandle: seo.twitterHandle,
  }))
  const defaultTitle = 'Visit Agadir — Travel Guide, Things to Do, Eat & Stay'
  const defaultDescription =
    'Your complete guide to Agadir, Morocco — discover things to do, the best restaurants, hotels and beaches, plus local businesses, reviews and travel tips.'
  await prisma.seoSettings.update({
    where: { id: seo.id },
    data: { defaultTitle, defaultDescription, twitterHandle: null },
  })
  console.log(`\nSeoSettings updated:`)
  console.log(`  title(${defaultTitle.length}): ${defaultTitle}`)
  console.log(`  desc(${defaultDescription.length}):  ${defaultDescription}`)
  console.log(`  twitterHandle: cleared`)
} else {
  console.log('No SeoSettings row!')
}

await prisma.$disconnect()
