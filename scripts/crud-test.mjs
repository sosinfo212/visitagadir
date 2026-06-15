#!/usr/bin/env node
/**
 * Full CRUD smoke test for Agadir Directory APIs.
 * Run: node scripts/crud-test.mjs
 */

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'agadir2024'
const RUN_ID = Date.now().toString(36)

const results = []
let passed = 0
let failed = 0

function assert(name, ok, detail = '') {
  if (ok) {
    passed++
    results.push({ name, status: 'PASS', detail })
    console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`)
  } else {
    failed++
    results.push({ name, status: 'FAIL', detail })
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

class CookieJar {
  constructor() {
    this.cookies = new Map()
  }
  ingest(res) {
    const raw = res.headers.getSetCookie?.() || []
    for (const line of raw) {
      const part = line.split(';')[0]
      const eq = part.indexOf('=')
      if (eq > 0) this.cookies.set(part.slice(0, eq), part.slice(eq + 1))
    }
  }
  header() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
  }
}

async function req(path, { method = 'GET', body, jar, expect } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (jar?.header()) headers.Cookie = jar.header()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  })
  if (jar) jar.ingest(res)
  let data = null
  const text = await res.text()
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  return { res, data, status: res.status }
}

async function adminLogin(jar) {
  const { status } = await req('/api/admin/login', {
    method: 'POST',
    body: { password: ADMIN_PASSWORD },
    jar,
  })
  return status === 200
}

async function userLogin(jar, email, password) {
  const csrf = await req('/api/auth/csrf', { jar })
  const token = csrf.data?.csrfToken
  if (!token) return false

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Cookie: jar.header(),
  }
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers,
    body: new URLSearchParams({
      csrfToken: token,
      email,
      password,
      json: 'true',
    }),
    redirect: 'manual',
  })
  jar.ingest(res)
  return res.status === 200 || res.status === 302
}

async function run() {
  console.log(`\nAgadir Directory CRUD Test — run ${RUN_ID}`)
  console.log(`Base URL: ${BASE}\n`)

  const adminJar = new CookieJar()
  const userJar = new CookieJar()
  const testEmail = `crud-test-${RUN_ID}@example.com`
  const testPassword = 'TestPass123!'

  const ids = {
    categoryId: null,
    listingId: null,
    reviewId: null,
    blogCategoryId: null,
    blogPostId: null,
    adId: null,
    pixelId: null,
    redirectId: null,
    submissionId: null,
    userId: null,
  }

  // ─── Public READ ───────────────────────────────────────
  console.log('── Public READ ──')
  {
    const c = await req('/api/categories')
    assert('Public GET /api/categories', c.status === 200 && Array.isArray(c.data))
    const l = await req('/api/listings')
    assert('Public GET /api/listings', l.status === 200 && Array.isArray(l.data))
    const b = await req('/api/blog/latest')
    assert('Public GET /api/blog/latest', b.status === 200 && Array.isArray(b.data))
    const s = await req('/api/settings/public')
    assert('Public GET /api/settings/public', s.status === 200 && s.data?.siteName)
    const sub = await req('/api/submissions')
    assert('Public GET /api/submissions blocked', sub.status === 401)
  }

  // ─── Admin auth ────────────────────────────────────────
  console.log('\n── Admin Auth ──')
  {
    const bad = await req('/api/admin/login', { method: 'POST', body: { password: 'wrong' } })
    assert('Admin login rejects bad password', bad.status === 401)
    const ok = await adminLogin(adminJar)
    assert('Admin login success', ok)
    const stats = await req('/api/admin/stats', { jar: adminJar })
    assert('Admin GET /api/admin/stats', stats.status === 200)
  }

  // ─── Categories CRUD ───────────────────────────────────
  console.log('\n── Categories CRUD ──')
  {
    const slug = `test-cat-${RUN_ID}`
    const create = await req('/api/admin/categories', {
      method: 'POST',
      jar: adminJar,
      body: { name: `Test Cat ${RUN_ID}`, slug, icon: 'Building2', description: 'CRUD test' },
    })
    assert('Category CREATE', create.status === 201, `status ${create.status}`)
    ids.categoryId = create.data?.id

    const list = await req('/api/admin/categories', { jar: adminJar })
    assert('Category READ list', list.status === 200 && list.data?.some((c) => c.id === ids.categoryId))

    const update = await req(`/api/admin/categories/${ids.categoryId}`, {
      method: 'PUT',
      jar: adminJar,
      body: { name: `Updated Cat ${RUN_ID}`, slug, icon: 'Building2' },
    })
    assert('Category UPDATE', update.status === 200 && update.data?.name?.includes('Updated'))
  }

  // ─── Listings CRUD ─────────────────────────────────────
  console.log('\n── Listings CRUD ──')
  {
    const create = await req('/api/admin/listings', {
      method: 'POST',
      jar: adminJar,
      body: {
        name: `CRUD Listing ${RUN_ID}`,
        description: 'Test listing for CRUD operations in Agadir.',
        address: '123 Test Blvd, Agadir',
        categoryId: ids.categoryId,
        phone: '+212600000000',
      },
    })
    assert('Listing CREATE', create.status === 201, create.data?.error || `status ${create.status}`)
    ids.listingId = create.data?.id

    const list = await req('/api/admin/listings', { jar: adminJar })
    const listItems = Array.isArray(list.data) ? list.data : list.data?.items
    assert('Listing READ list', list.status === 200 && listItems?.some((l) => l.id === ids.listingId))

    const update = await req(`/api/admin/listings/${ids.listingId}`, {
      method: 'PUT',
      jar: adminJar,
      body: {
        name: `Updated Listing ${RUN_ID}`,
        description: 'Updated description for CRUD test.',
        address: '456 Updated St, Agadir',
        categoryId: ids.categoryId,
      },
    })
    assert('Listing UPDATE', update.status === 200, update.data?.error || `status ${update.status}`)
  }

  // ─── Reviews CRUD ──────────────────────────────────────
  console.log('\n── Reviews CRUD ──')
  {
    const create = await req('/api/reviews', {
      method: 'POST',
      body: {
        listingId: ids.listingId,
        authorName: 'CRUD Tester',
        rating: 5,
        comment: 'Excellent place for automated CRUD testing!',
      },
    })
    assert('Review CREATE (public)', create.status === 201, create.data?.error || `status ${create.status}`)
    ids.reviewId = create.data?.id

    const pubRead = await req(`/api/reviews?listingId=${ids.listingId}`)
    assert('Review public READ hides pending', pubRead.status === 200 && !pubRead.data?.some((r) => r.id === ids.reviewId))

    const adminList = await req('/api/admin/reviews', { jar: adminJar })
    assert('Review admin READ', adminList.status === 200 && adminList.data?.some((r) => r.id === ids.reviewId))

    const approve = await req(`/api/admin/reviews/${ids.reviewId}`, {
      method: 'PUT',
      jar: adminJar,
      body: { approved: true },
    })
    assert('Review UPDATE (approve)', approve.status === 200)

    const pubAfter = await req(`/api/reviews?listingId=${ids.listingId}`)
    assert('Review public READ after approve', pubAfter.data?.some((r) => r.id === ids.reviewId))

    const del = await req(`/api/admin/reviews/${ids.reviewId}`, { method: 'DELETE', jar: adminJar })
    assert('Review DELETE', del.status === 200)
    ids.reviewId = null
  }

  // ─── Blog categories + posts CRUD ────────────────────
  console.log('\n── Blog CRUD ──')
  {
    const catSlug = `test-blog-cat-${RUN_ID}`
    const catCreate = await req('/api/admin/blog/categories', {
      method: 'POST',
      jar: adminJar,
      body: { name: `Blog Cat ${RUN_ID}`, slug: catSlug, description: 'Test' },
    })
    assert('Blog category CREATE', catCreate.status === 201)
    ids.blogCategoryId = catCreate.data?.id

    const catList = await req('/api/admin/blog/categories', { jar: adminJar })
    assert('Blog category READ', catList.status === 200)

    const catUpdate = await req(`/api/admin/blog/categories/${ids.blogCategoryId}`, {
      method: 'PUT',
      jar: adminJar,
      body: { name: `Updated Blog Cat ${RUN_ID}`, slug: catSlug },
    })
    assert('Blog category UPDATE', catUpdate.status === 200)

    const postSlug = `crud-post-${RUN_ID}`
    const postCreate = await req('/api/admin/blog', {
      method: 'POST',
      jar: adminJar,
      body: {
        title: `CRUD Post ${RUN_ID}`,
        slug: postSlug,
        content: '<p>Test blog content for CRUD.</p>',
        categoryId: ids.blogCategoryId,
        status: 'published',
        excerpt: 'CRUD test excerpt',
      },
    })
    assert('Blog post CREATE', postCreate.status === 201, postCreate.data?.error || `status ${postCreate.status}`)
    ids.blogPostId = postCreate.data?.id

    const postList = await req('/api/admin/blog', { jar: adminJar })
    assert('Blog post READ', postList.status === 200 && postList.data?.some((p) => p.id === ids.blogPostId))

    const postUpdate = await req(`/api/admin/blog/${ids.blogPostId}`, {
      method: 'PUT',
      jar: adminJar,
      body: {
        title: `Updated CRUD Post ${RUN_ID}`,
        slug: postSlug,
        content: '<p>Updated content.</p>',
        categoryId: ids.blogCategoryId,
        status: 'published',
      },
    })
    assert('Blog post UPDATE', postUpdate.status === 200, postUpdate.data?.error || `status ${postUpdate.status}`)

    const postDel = await req(`/api/admin/blog/${ids.blogPostId}`, { method: 'DELETE', jar: adminJar })
    assert('Blog post DELETE', postDel.status === 200)
    ids.blogPostId = null

    const catDel = await req(`/api/admin/blog/categories/${ids.blogCategoryId}`, { method: 'DELETE', jar: adminJar })
    assert('Blog category DELETE', catDel.status === 200)
    ids.blogCategoryId = null
  }

  // ─── Ads CRUD ──────────────────────────────────────────
  console.log('\n── Ads CRUD ──')
  {
    const read = await req('/api/admin/ads', { jar: adminJar })
    assert('Ads READ', read.status === 200 && read.data?.placements)

    const create = await req('/api/admin/ads', {
      method: 'POST',
      jar: adminJar,
      body: {
        name: `Test Ad ${RUN_ID}`,
        location: `test_ad_${RUN_ID}`,
        slotId: '9999999999',
        format: 'auto',
        adType: 'adsense',
        enabled: true,
        position: 99,
      },
    })
    assert('Ad CREATE', create.status === 201)
    ids.adId = create.data?.id

    const update = await req(`/api/admin/ads/${ids.adId}`, {
      method: 'PUT',
      jar: adminJar,
      body: { name: `Updated Ad ${RUN_ID}`, enabled: false },
    })
    assert('Ad UPDATE', update.status === 200)

    const del = await req(`/api/admin/ads/${ids.adId}`, { method: 'DELETE', jar: adminJar })
    assert('Ad DELETE', del.status === 200)
    ids.adId = null
  }

  // ─── Pixels CRUD ───────────────────────────────────────
  console.log('\n── Pixels CRUD ──')
  {
    const read = await req('/api/admin/pixels', { jar: adminJar })
    assert('Pixels READ', read.status === 200 && Array.isArray(read.data))

    const create = await req('/api/admin/pixels', {
      method: 'POST',
      jar: adminJar,
      body: { type: 'custom_head', name: `Test Pixel ${RUN_ID}`, pixelId: 'PX-TEST', enabled: false, position: 99 },
    })
    assert('Pixel CREATE', create.status === 201)
    ids.pixelId = create.data?.id

    const update = await req(`/api/admin/pixels/${ids.pixelId}`, {
      method: 'PUT',
      jar: adminJar,
      body: { name: `Updated Pixel ${RUN_ID}`, enabled: true },
    })
    assert('Pixel UPDATE', update.status === 200)

    const del = await req(`/api/admin/pixels/${ids.pixelId}`, { method: 'DELETE', jar: adminJar })
    assert('Pixel DELETE', del.status === 200)
    ids.pixelId = null
  }

  // ─── Redirects CRUD ────────────────────────────────────
  console.log('\n── Redirects CRUD ──')
  {
    const read = await req('/api/admin/seo/redirects', { jar: adminJar })
    assert('Redirects READ', read.status === 200 && Array.isArray(read.data))

    const create = await req('/api/admin/seo/redirects', {
      method: 'POST',
      jar: adminJar,
      body: { source: `/old-crud-${RUN_ID}`, destination: '/', statusCode: 301, enabled: true },
    })
    assert('Redirect CREATE', create.status === 201)
    ids.redirectId = create.data?.id

    const update = await req(`/api/admin/seo/redirects/${ids.redirectId}`, {
      method: 'PUT',
      jar: adminJar,
      body: { destination: '/blog', statusCode: 302 },
    })
    assert('Redirect UPDATE', update.status === 200)

    const del = await req(`/api/admin/seo/redirects/${ids.redirectId}`, { method: 'DELETE', jar: adminJar })
    assert('Redirect DELETE', del.status === 200)
    ids.redirectId = null
  }

  // ─── App Settings CRUD ─────────────────────────────────
  console.log('\n── App Settings ──')
  {
    const read = await req('/api/admin/settings', { jar: adminJar })
    assert('Settings READ', read.status === 200 && read.data?.siteName)
    const originalName = read.data.siteName

    const update = await req('/api/admin/settings', {
      method: 'PUT',
      jar: adminJar,
      body: { siteName: `${originalName}`, siteLogoWidth: 36, siteLogoHeight: 36 },
    })
    assert('Settings UPDATE', update.status === 200 && update.data?.siteLogoWidth === 36)

    const revert = await req('/api/admin/settings', {
      method: 'PUT',
      jar: adminJar,
      body: { siteLogoWidth: 32, siteLogoHeight: 32 },
    })
    assert('Settings revert dimensions', revert.status === 200)
  }

  // ─── Analytics + Users READ ────────────────────────────
  console.log('\n── Analytics & Users ──')
  {
    const analytics = await req('/api/admin/analytics', { jar: adminJar })
    assert('Analytics READ', analytics.status === 200 && analytics.data?.overview)
    const users = await req('/api/admin/users', { jar: adminJar })
    assert('Users READ', users.status === 200 && Array.isArray(users.data))
  }

  // ─── User auth + submissions CRUD ──────────────────────
  console.log('\n── User Submissions CRUD ──')
  {
    const reg = await req('/api/auth/register', {
      method: 'POST',
      body: { name: 'CRUD User', email: testEmail, password: testPassword },
    })
    assert('User REGISTER', reg.status === 200 || reg.status === 201, reg.data?.error || `status ${reg.status}`)

    const loggedIn = await userLogin(userJar, testEmail, testPassword)
    assert('User LOGIN', loggedIn)

    const subCreate = await req('/api/submissions', {
      method: 'POST',
      jar: userJar,
      body: {
        businessName: `User Biz ${RUN_ID}`,
        description: 'User submission for CRUD testing in Agadir.',
        category: `test-cat-${RUN_ID}`,
        address: '789 User St, Agadir',
        ownerName: 'CRUD User',
        phone: '+212611111111',
      },
    })
    assert('Submission CREATE', subCreate.status === 201, subCreate.data?.error || `status ${subCreate.status}`)
    ids.submissionId = subCreate.data?.submission?.id || subCreate.data?.id

    const myList = await req('/api/my-listings', { jar: userJar })
    assert('My listings READ', myList.status === 200 && myList.data?.some((i) => i.submissionId === ids.submissionId || i.id === ids.submissionId))

    const subUpdate = await req(`/api/my-submissions/${ids.submissionId}`, {
      method: 'PUT',
      jar: userJar,
      body: {
        name: `Updated User Biz ${RUN_ID}`,
        businessName: `Updated User Biz ${RUN_ID}`,
        description: 'Updated user submission.',
        address: '789 Updated St, Agadir',
        category: `test-cat-${RUN_ID}`,
      },
    })
    assert('Submission UPDATE (owner)', subUpdate.status === 200, subUpdate.data?.error || `status ${subUpdate.status}`)

    const adminApprove = await req(`/api/admin/submissions/${ids.submissionId}`, {
      method: 'PUT',
      jar: adminJar,
      body: { status: 'approved' },
    })
    assert('Submission UPDATE (admin approve)', adminApprove.status === 200)

    const myAfter = await req('/api/my-listings', { jar: userJar })
    const approved = myAfter.data?.find((i) => i.submissionId === ids.submissionId)
    assert('My listings shows approved', approved?.status === 'approved' && approved?.listingId)

    const subDel = await req(`/api/my-submissions/${ids.submissionId}`, { method: 'DELETE', jar: userJar })
    assert('Submission DELETE (owner)', subDel.status === 200)
    ids.submissionId = null
  }

  // ─── Cleanup ───────────────────────────────────────────
  console.log('\n── Cleanup ──')
  {
    if (ids.listingId) {
      const d = await req(`/api/admin/listings/${ids.listingId}`, { method: 'DELETE', jar: adminJar })
      assert('Cleanup listing DELETE', d.status === 200)
    }
    if (ids.categoryId) {
      const d = await req(`/api/admin/categories/${ids.categoryId}`, { method: 'DELETE', jar: adminJar })
      assert('Cleanup category DELETE', d.status === 200)
    }
    // Delete test user via admin
    const users = await req('/api/admin/users', { jar: adminJar })
    const userList = Array.isArray(users.data) ? users.data : []
    const testUser = userList.find((u) => u.email === testEmail)
    if (testUser) {
      ids.userId = testUser.id
      const d = await req(`/api/admin/users/${ids.userId}`, { method: 'DELETE', jar: adminJar })
      assert('Cleanup user DELETE', d.status === 200)
    }
  }

  // ─── Summary ───────────────────────────────────────────
  console.log('\n══════════════════════════════════════')
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`)
  console.log('══════════════════════════════════════\n')

  if (failed > 0) {
    console.log('Failures:')
    results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  - ${r.name}: ${r.detail}`))
    process.exit(1)
  }
}

run().catch((e) => {
  console.error('Test runner crashed:', e)
  process.exit(1)
})
