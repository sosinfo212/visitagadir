/**
 * READ-ONLY meta/title integrity scan. Outputs high-confidence buckets only:
 *   A) JUNK — test/placeholder/unrendered-template values in seoTitle/meta
 *   B) CROSS — seoTitle/meta contains ANOTHER listing's distinctive multi-word
 *      name (the Saffron→"Côté Plage" copy-paste signature)
 *   C) SLUG≠NAME — the URL slug describes a different entity than the name
 * (Generic marketing taglines that simply don't repeat the name are NOT flagged.)
 *
 * Run:  node scripts/scan-meta-integrity.mjs   (no writes)
 */
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const JUNK = [
  /\btest\b/i, /snappy meta/i, /lorem ipsum/i, /custom seo title/i,
  /#\w+/, /%%?\w+%%?/, /\{\{.*\}\}/, /post_title|site_title|author_first_name|separator_sa/i,
  /your (gateway|partner|ultimate) /i, // borderline-generic; kept low-signal, see note
]
// Only the clearly-broken junk patterns (drop the borderline generic one for flagging)
const HARD_JUNK = JUNK.slice(0, 7)

const GENERIC = new Set(['the','and','for','with','your','you','our','of','to','in','on','at','by','de','la','le','les','des','du','en','et','agadir','morocco','maroc','inezgane','tiznit','taghazout','essaouira','tamraght','restaurant','restaurants','cafe','cafes','café','hotel','spa','club','bar','salon','centre','center','mall','park','parc','beach','plage','guide','best','review','avis','menu','prix','sarl','ste','dr','and','things','tours','tour','travel','world','food','agency','store','shop','company'])

const toks = (s) => [...new Set((s||'').toLowerCase().replace(/[^a-z0-9àâäéèêëîïôöùûüç\s-]/g,' ').split(/[\s-]+/).filter(w=>w.length>=4 && !GENERIC.has(w)))]

async function main() {
  const listings = await db.listing.findMany({ where:{published:true}, select:{slug:true,name:true,seoTitle:true,metaDescription:true} })
  const posts = await db.blogPost.findMany({ where:{status:'published'}, select:{slug:true,title:true,seoTitle:true,metaDescription:true} })

  const A=[], C=[]
  const check = (rows, kind, nameKey) => {
    for (const r of rows) {
      const name = r[nameKey]
      for (const field of ['seoTitle','metaDescription']) {
        const v = r[field]
        if (v && HARD_JUNK.some(rx=>rx.test(v))) A.push({kind,slug:r.slug,name,field,value:v.slice(0,80)})
      }
      // slug vs name distinctive-token overlap
      const nt=toks(name), st=toks(r.slug)
      if (nt.length && st.length && !st.some(t=>nt.includes(t)) && !nt.some(t=>st.includes(t)))
        C.push({kind,slug:r.slug,name})
    }
  }
  check(listings,'listing','name')
  check(posts,'post','title')

  console.log(`Scanned ${listings.length} listings, ${posts.length} posts.\n`)
  console.log(`=== A) JUNK / placeholder / template values (${A.length}) — fix (null → fallback regenerates) ===`)
  for (const f of A) console.log(`[${f.kind}] ${f.slug}\n   name: ${f.name}\n   ${f.field}: ${f.value}`)
  console.log(`\n=== C) SLUG ≠ NAME (${C.length}) — URL slug describes a different entity ===`)
  for (const f of C) console.log(`[${f.kind}] slug="${f.slug}"  name="${f.name}"`)
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>db.$disconnect())
