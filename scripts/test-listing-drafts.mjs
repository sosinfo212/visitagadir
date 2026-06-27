#!/usr/bin/env node
/**
 * Smoke test for listing drafts + broken image scan APIs.
 * Run: node scripts/test-listing-drafts.mjs
 */
const BASE = process.env.BASE_URL || 'http://localhost:3000'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'agadir2024'

async function main() {
  const jar = new Map()

  function storeCookies(res) {
    const raw = res.headers.getSetCookie?.() ?? []
    for (const line of raw) {
      const [pair] = line.split(';')
      const [name, ...rest] = pair.split('=')
      jar.set(name, rest.join('='))
    }
  }

  function cookieHeader() {
    return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
  }

  const loginRes = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  })
  storeCookies(loginRes)
  if (!loginRes.ok) {
    console.error('FAIL: admin login', loginRes.status)
    process.exit(1)
  }
  console.log('PASS: admin login')

  const draftsRes = await fetch(`${BASE}/api/admin/listings?published=false&limit=5`, {
    headers: { Cookie: cookieHeader() },
  })
  const drafts = await draftsRes.json()
  if (!draftsRes.ok) {
    console.error('FAIL: fetch drafts', draftsRes.status, drafts)
    process.exit(1)
  }
  console.log(`PASS: drafts API (${drafts.total} unpublished listings)`)

  const scanRes = await fetch(`${BASE}/api/admin/listings/scan-broken-images`, {
    method: 'POST',
    headers: { Cookie: cookieHeader() },
  })
  const scan = await scanRes.json()
  if (!scanRes.ok) {
    console.error('FAIL: scan broken images', scanRes.status, scan)
    process.exit(1)
  }
  console.log(`PASS: scan broken images — scanned ${scan.scanned}, affected ${scan.affectedCount}, drafted ${scan.drafted}`)

  const pageRes = await fetch(`${BASE}/admin/listings/drafts`, {
    headers: { Cookie: cookieHeader() },
  })
  if (!pageRes.ok) {
    console.error('FAIL: drafts page', pageRes.status)
    process.exit(1)
  }
  console.log('PASS: drafts admin page loads (HTTP 200)')

  console.log('All listing drafts tests passed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
