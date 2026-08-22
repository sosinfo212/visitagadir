import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const row = await prisma.appSettings.findFirst({ orderBy: { createdAt: 'asc' } })
if (row) {
  console.log('BEFORE footerLogoUrl:', row.footerLogoUrl)
  await prisma.appSettings.update({ where: { id: row.id }, data: { footerLogoUrl: '/uploads/logos/footer-logo.png' } })
  console.log('AFTER  footerLogoUrl: /uploads/logos/footer-logo.png')
} else console.log('No AppSettings row')
await prisma.$disconnect()
