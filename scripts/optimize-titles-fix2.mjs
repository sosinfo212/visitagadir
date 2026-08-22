import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const M = {
  'discovering-agadirs-shopping-paradises-a-guide-to-the-best-shopping-centers': ['Best Shopping Malls in Agadir (2026): Where to Shop', "Agadir's best shopping malls and centres — Marjane, Souk El Had and more, with what to find, opening hours and where to go for what."],
  'top-family-activities-agadir-visitors-love': ['Things to Do in Agadir with Kids (2026): Family Fun', 'The best things to do in Agadir with kids — beaches, the cable car, mini-golf, Crocoparc and more family activities for all ages.'],
}
for (const [slug,[seoTitle,metaDescription]] of Object.entries(M)) {
  const r = await prisma.blogPost.findUnique({ where:{slug}, select:{id:true} })
  if(!r){console.log('miss',slug);continue}
  await prisma.blogPost.update({ where:{slug}, data:{seoTitle,metaDescription} })
  console.log('OK',slug)
}
await prisma.$disconnect()
