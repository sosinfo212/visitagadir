'use client'

/**
 * Unified SEO admin page.
 *
 * Tabs:
 *   1. General        — site identity & default meta
 *   2. Schema         — Organization + WebSite source-of-truth
 *   3. Open Graph     — defaults for social cards
 *   4. Social         — list of social profile URLs
 *   5. Sitemap        — stats + regenerate
 *   6. Redirects      — CRUD
 *
 * Internal Linking is automatic and policy-driven (see lib/seo/internal-linking)
 * so there's nothing for the admin to configure here; the tab section in the
 * spec is satisfied by visible documentation in the Sitemap tab.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  Globe, Building2, Share2, Map as MapIcon, ArrowRightLeft, Link2,
  Save, CheckCircle2, AlertCircle, Loader2, Plus, Trash2,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface SeoSettings {
  siteName: string
  siteUrl: string
  defaultTitle: string
  titleTemplate: string
  defaultDescription: string
  defaultKeywords: string | null
  defaultRobots: string
  canonicalDomain: string
  faviconUrl: string
  defaultOgImage: string | null
  defaultLocale: string
  twitterHandle: string | null
  twitterCardType: string
}

interface SchemaSettings {
  organizationName: string
  organizationType: string
  logoUrl: string | null
  phone: string | null
  email: string | null
  streetAddress: string | null
  addressLocality: string
  addressRegion: string
  postalCode: string | null
  country: string
  websiteUrl: string
  searchUrlPattern: string
  schemaTypeCatalog: Record<string, string>
}

interface SocialProfile {
  platform: string
  url: string
  enabled: boolean
}

interface Redirect {
  id: string
  source: string
  destination: string
  statusCode: number
  enabled: boolean
  hits: number
}

interface SitemapInfo {
  siteUrl: string
  sitemapUrl: string
  robotsUrl: string
  stats: { categories: number; listings: number; cities: number; total: number }
}

export default function SeoAdminPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">SEO & Schema</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Centralized control over metadata, structured data, sitemap, and redirects.
        </p>
      </header>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-white border h-auto p-1 flex flex-wrap gap-1">
          <TabsTrigger value="general" className="gap-2"><Globe className="h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="schema" className="gap-2"><Building2 className="h-4 w-4" /> Schema</TabsTrigger>
          <TabsTrigger value="opengraph" className="gap-2"><Share2 className="h-4 w-4" /> Open Graph</TabsTrigger>
          <TabsTrigger value="social" className="gap-2"><Share2 className="h-4 w-4" /> Social Profiles</TabsTrigger>
          <TabsTrigger value="sitemap" className="gap-2"><MapIcon className="h-4 w-4" /> Sitemap</TabsTrigger>
          <TabsTrigger value="linking" className="gap-2"><Link2 className="h-4 w-4" /> Internal Linking</TabsTrigger>
          <TabsTrigger value="redirects" className="gap-2"><ArrowRightLeft className="h-4 w-4" /> Redirects</TabsTrigger>
        </TabsList>

        <TabsContent value="general"><GeneralPanel /></TabsContent>
        <TabsContent value="schema"><SchemaPanel /></TabsContent>
        <TabsContent value="opengraph"><OpenGraphPanel /></TabsContent>
        <TabsContent value="social"><SocialPanel /></TabsContent>
        <TabsContent value="sitemap"><SitemapPanel /></TabsContent>
        <TabsContent value="linking"><InternalLinkingPanel /></TabsContent>
        <TabsContent value="redirects"><RedirectsPanel /></TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Shared bits ─────────────────────────────────────────

function StatusToast({ status }: { status: 'idle' | 'saving' | 'saved' | 'error'; message?: string }) {
  if (status === 'idle') return null
  if (status === 'saving') return <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</span>
  if (status === 'saved') return <span className="text-xs text-green-600 inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</span>
  return <span className="text-xs text-red-600 inline-flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Error</span>
}

function useResourceForm<T extends object>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (res.ok) setData(await res.json())
    } finally { setLoading(false) }
  }, [url])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (payload: Partial<T>) => {
    setStatus('saving'); setError(null)
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      const updated = await res.json()
      setData(prev => ({ ...(prev as object), ...updated } as T))
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1500)
    } catch (e) {
      setStatus('error'); setError(e instanceof Error ? e.message : 'Unknown error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }, [url])

  return { data, setData, loading, status, error, save }
}

// ─── 1. General ──────────────────────────────────────────

function GeneralPanel() {
  const { data, setData, loading, status, error, save } = useResourceForm<SeoSettings>('/api/admin/seo/general')
  if (loading || !data) return <PanelSkeleton />

  const set = <K extends keyof SeoSettings>(field: K, value: SeoSettings[K]) =>
    setData(prev => prev ? { ...prev, [field]: value } : prev)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">General settings</CardTitle>
        <div className="flex items-center gap-3">
          <StatusToast status={status} />
          <Button size="sm" onClick={() => save(data)}><Save className="h-4 w-4 mr-1" /> Save changes</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2">{error}</div>}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Site name" required>
            <Input value={data.siteName} onChange={e => set('siteName', e.target.value)} />
          </Field>
          <Field label="Site URL" required>
            <Input placeholder="https://example.com" value={data.siteUrl} onChange={e => set('siteUrl', e.target.value)} />
          </Field>
          <Field label="Default SEO title" required>
            <Input value={data.defaultTitle} onChange={e => set('defaultTitle', e.target.value)} />
          </Field>
          <Field label="Title template (use %s)" required hint="e.g. %s | My Directory">
            <Input value={data.titleTemplate} onChange={e => set('titleTemplate', e.target.value)} />
          </Field>
        </div>
        <Field label="Default meta description" required>
          <Textarea value={data.defaultDescription} onChange={e => set('defaultDescription', e.target.value)} rows={3} />
        </Field>
        <Field label="Default keywords (comma-separated)">
          <Input value={data.defaultKeywords ?? ''} onChange={e => set('defaultKeywords', e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Robots default" required hint="e.g. index,follow | noindex,nofollow">
            <Input value={data.defaultRobots} onChange={e => set('defaultRobots', e.target.value)} />
          </Field>
          <Field label="Canonical domain" required>
            <Input value={data.canonicalDomain} onChange={e => set('canonicalDomain', e.target.value)} />
          </Field>
          <Field label="Favicon URL" required>
            <Input value={data.faviconUrl} onChange={e => set('faviconUrl', e.target.value)} />
          </Field>
          <Field label="Default social image">
            <Input placeholder="/social-default.png or full URL" value={data.defaultOgImage ?? ''} onChange={e => set('defaultOgImage', e.target.value)} />
          </Field>
          <Field label="Default locale" required hint="e.g. en_MA, fr_FR">
            <Input value={data.defaultLocale} onChange={e => set('defaultLocale', e.target.value)} />
          </Field>
          <Field label="Twitter card type" required>
            <Select value={data.twitterCardType} onValueChange={v => set('twitterCardType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">summary</SelectItem>
                <SelectItem value="summary_large_image">summary_large_image</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Twitter handle (with @)">
            <Input placeholder="@agadir" value={data.twitterHandle ?? ''} onChange={e => set('twitterHandle', e.target.value)} />
          </Field>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── 2. Schema (Organization + WebSite) ─────────────────

function SchemaPanel() {
  const { data, setData, loading, status, error, save } = useResourceForm<SchemaSettings>('/api/admin/seo/schema')
  if (loading || !data) return <PanelSkeleton />

  const set = <K extends keyof SchemaSettings>(field: K, value: SchemaSettings[K]) =>
    setData(prev => prev ? { ...prev, [field]: value } : prev)

  const typeEntries = Object.entries(data.schemaTypeCatalog || { Organization: 'Organization' })

  // Don't send the catalog back to PUT — it's read-only metadata.
  const submit = () => {
    const { schemaTypeCatalog: _catalog, ...payload } = data
    void _catalog
    save(payload as Partial<SchemaSettings>)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Organization & WebSite schema</CardTitle>
        <div className="flex items-center gap-3">
          <StatusToast status={status} />
          <Button size="sm" onClick={submit}><Save className="h-4 w-4 mr-1" /> Save changes</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2">{error}</div>}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Organization name" required>
            <Input value={data.organizationName} onChange={e => set('organizationName', e.target.value)} />
          </Field>
          <Field label="Schema type" required>
            <Select value={data.organizationType} onValueChange={v => set('organizationType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Organization">Organization (generic)</SelectItem>
                {typeEntries.map(([label, value]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Website URL" required>
            <Input value={data.websiteUrl} onChange={e => set('websiteUrl', e.target.value)} />
          </Field>
          <Field label="Search URL pattern" required hint="Use {search_term_string} as the query placeholder.">
            <Input value={data.searchUrlPattern} onChange={e => set('searchUrlPattern', e.target.value)} />
          </Field>
          <Field label="Logo URL">
            <Input placeholder="/logo.png" value={data.logoUrl ?? ''} onChange={e => set('logoUrl', e.target.value)} />
          </Field>
          <Field label="Phone"><Input value={data.phone ?? ''} onChange={e => set('phone', e.target.value)} /></Field>
          <Field label="Email"><Input value={data.email ?? ''} onChange={e => set('email', e.target.value)} /></Field>
          <Field label="Street address"><Input value={data.streetAddress ?? ''} onChange={e => set('streetAddress', e.target.value)} /></Field>
          <Field label="City / locality" required><Input value={data.addressLocality} onChange={e => set('addressLocality', e.target.value)} /></Field>
          <Field label="Region" required><Input value={data.addressRegion} onChange={e => set('addressRegion', e.target.value)} /></Field>
          <Field label="Postal code"><Input value={data.postalCode ?? ''} onChange={e => set('postalCode', e.target.value)} /></Field>
          <Field label="Country (ISO-2)" required><Input value={data.country} onChange={e => set('country', e.target.value)} /></Field>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── 3. Open Graph defaults ─────────────────────────────

function OpenGraphPanel() {
  // OG defaults live on the same SeoSettings row. We expose only the OG-
  // relevant fields here for clarity.
  const { data, setData, loading, status, error, save } = useResourceForm<SeoSettings>('/api/admin/seo/general')
  if (loading || !data) return <PanelSkeleton />

  const set = <K extends keyof SeoSettings>(field: K, value: SeoSettings[K]) =>
    setData(prev => prev ? { ...prev, [field]: value } : prev)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Open Graph & Twitter card defaults</CardTitle>
        <div className="flex items-center gap-3">
          <StatusToast status={status} />
          <Button size="sm" onClick={() => save({
            defaultOgImage: data.defaultOgImage,
            defaultLocale: data.defaultLocale,
            twitterCardType: data.twitterCardType,
            twitterHandle: data.twitterHandle,
          })}><Save className="h-4 w-4 mr-1" /> Save</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2">{error}</div>}
        <p className="text-sm text-muted-foreground">
          These values fill in when a page doesn’t set its own. Business pages
          will use their featured image; category pages use the category image;
          everything else falls back to the default below.
        </p>
        <Field label="Default social image (og:image / twitter:image)" hint="Recommended 1200×630">
          <Input placeholder="/social-default.png or full URL" value={data.defaultOgImage ?? ''} onChange={e => set('defaultOgImage', e.target.value)} />
          {data.defaultOgImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.defaultOgImage} alt="" className="mt-2 max-h-40 rounded border" />
          )}
        </Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Default locale"><Input value={data.defaultLocale} onChange={e => set('defaultLocale', e.target.value)} /></Field>
          <Field label="Twitter card type">
            <Select value={data.twitterCardType} onValueChange={v => set('twitterCardType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">summary</SelectItem>
                <SelectItem value="summary_large_image">summary_large_image</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Twitter handle"><Input placeholder="@agadir" value={data.twitterHandle ?? ''} onChange={e => set('twitterHandle', e.target.value)} /></Field>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── 4. Social profiles ─────────────────────────────────

const SOCIAL_PLATFORMS = ['facebook', 'instagram', 'linkedin', 'youtube', 'twitter', 'tiktok', 'pinterest', 'whatsapp']

function SocialPanel() {
  const [profiles, setProfiles] = useState<SocialProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    fetch('/api/admin/seo/social', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setProfiles(d.profiles || []))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setStatus('saving')
    try {
      const r = await fetch('/api/admin/seo/social', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles }),
      })
      if (!r.ok) throw new Error()
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1500)
    } catch {
      setStatus('error'); setTimeout(() => setStatus('idle'), 2500)
    }
  }

  const add = () => setProfiles(p => [...p, { platform: 'facebook', url: '', enabled: true }])
  const remove = (i: number) => setProfiles(p => p.filter((_, k) => k !== i))
  const update = (i: number, patch: Partial<SocialProfile>) =>
    setProfiles(p => p.map((row, k) => k === i ? { ...row, ...patch } : row))

  if (loading) return <PanelSkeleton />

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Social profiles (sameAs)</CardTitle>
        <div className="flex items-center gap-3">
          <StatusToast status={status} />
          <Button size="sm" variant="outline" onClick={add}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          <Button size="sm" onClick={save}><Save className="h-4 w-4 mr-1" /> Save</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Listed in Organization JSON-LD’s <code className="text-xs bg-muted px-1 py-0.5 rounded">sameAs</code> array so Google understands your social presence.
        </p>
        {profiles.length === 0 && (
          <div className="text-sm text-muted-foreground border rounded-lg p-6 text-center">
            No social profiles yet. Click <b>Add</b> to insert one.
          </div>
        )}
        {profiles.map((p, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <Select value={p.platform} onValueChange={v => update(i, { platform: v })}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOCIAL_PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input className="flex-1 min-w-[240px]" placeholder="https://…" value={p.url} onChange={e => update(i, { url: e.target.value })} />
            <div className="flex items-center gap-2">
              <Switch checked={p.enabled} onCheckedChange={v => update(i, { enabled: v })} />
              <span className="text-xs text-muted-foreground">enabled</span>
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ─── 5. Sitemap ──────────────────────────────────────────

function SitemapPanel() {
  const [info, setInfo] = useState<SitemapInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/seo/sitemap', { cache: 'no-store' })
      if (r.ok) setInfo(await r.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const regenerate = async () => {
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/admin/seo/sitemap', { method: 'POST' })
      if (!r.ok) throw new Error()
      setMsg('Cache cleared. The next request to /sitemap.xml will rebuild from the database.')
    } catch {
      setMsg('Failed to regenerate.')
    } finally { setBusy(false) }
  }

  if (loading || !info) return <PanelSkeleton />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Sitemap</CardTitle>
          <Button size="sm" disabled={busy} onClick={regenerate}>
            {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Regenerate
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {msg && <div className="rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-2">{msg}</div>}
          <div className="grid sm:grid-cols-2 gap-3">
            <Stat label="Sitemap URL" value={<a className="text-blue-600 underline" href={info.sitemapUrl} target="_blank" rel="noreferrer">{info.sitemapUrl}</a>} />
            <Stat label="Robots URL" value={<a className="text-blue-600 underline" href={info.robotsUrl} target="_blank" rel="noreferrer">{info.robotsUrl}</a>} />
          </div>
          <div className="grid sm:grid-cols-4 gap-3 pt-2">
            <Stat label="Categories" value={info.stats.categories} />
            <Stat label="Listings" value={info.stats.listings} />
            <Stat label="Cities" value={info.stats.cities} />
            <Stat label="Total entries" value={info.stats.total} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── 6. Internal linking preview ─────────────────────────

interface LinkingPreview {
  homepage: { categories: number; featured: number }
  categories: Array<{ name: string; slug: string }>
  featured: Array<{ name: string; slug: string }>
  cities: Array<{ city: string; slug: string; count: number }>
  policies: Record<string, string>
}

function InternalLinkingPanel() {
  const [data, setData] = useState<LinkingPreview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/seo/internal-linking', { cache: 'no-store' })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <PanelSkeleton />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">Automatic internal linking</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>All links are server-rendered HTML so crawlers see them on first paint. No admin configuration required — policies are code-driven and scale to 100k+ listings via indexed queries.</p>
          <ul className="list-disc pl-5 space-y-1">
            {Object.entries(data.policies).map(([k, v]) => (
              <li key={k}><b>{k}</b> — {v}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Homepage</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>{data.homepage.categories} category links</p>
            <p>{data.homepage.featured} featured business links</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Categories (sample)</CardTitle></CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
              {data.categories.map(c => <li key={c.slug}>{c.name}</li>)}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Cities (sample)</CardTitle></CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
              {data.cities.map(c => (
                <li key={c.slug}>{c.city} <span className="text-muted-foreground">({c.count})</span></li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Featured businesses linked from homepage</CardTitle></CardHeader>
        <CardContent>
          <ul className="text-sm grid sm:grid-cols-2 gap-1">
            {data.featured.map(l => <li key={l.slug}>{l.name}</li>)}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── 7. Redirects ────────────────────────────────────────

function RedirectsPanel() {
  const [rows, setRows] = useState<Redirect[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState({ source: '', destination: '', statusCode: 301 })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/seo/redirects', { cache: 'no-store' })
      if (r.ok) setRows(await r.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const add = async () => {
    setBusy(true); setError(null)
    try {
      const r = await fetch('/api/admin/seo/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j.error || `HTTP ${r.status}`)
      }
      setDraft({ source: '', destination: '', statusCode: 301 })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally { setBusy(false) }
  }

  const toggle = async (id: string, enabled: boolean) => {
    await fetch(`/api/admin/seo/redirects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this redirect?')) return
    await fetch(`/api/admin/seo/redirects/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <PanelSkeleton />

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Redirects</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-4 bg-muted/30">
          <p className="text-sm font-medium mb-3">Add new redirect</p>
          {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_auto] gap-2">
            <Input placeholder="/old-path" value={draft.source} onChange={e => setDraft(d => ({ ...d, source: e.target.value }))} />
            <Input placeholder="/new-path or https://…" value={draft.destination} onChange={e => setDraft(d => ({ ...d, destination: e.target.value }))} />
            <Select value={String(draft.statusCode)} onValueChange={v => setDraft(d => ({ ...d, statusCode: Number(v) }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="301">301 permanent</SelectItem>
                <SelectItem value="302">302 found</SelectItem>
                <SelectItem value="307">307 temporary</SelectItem>
                <SelectItem value="308">308 permanent</SelectItem>
              </SelectContent>
            </Select>
            <Button disabled={busy || !draft.source || !draft.destination} onClick={add}>
              {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Add
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-lg p-6 text-center">No redirects configured.</div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2">Source</th>
                  <th className="text-left px-3 py-2">Destination</th>
                  <th className="text-left px-3 py-2">Code</th>
                  <th className="text-left px-3 py-2">Hits</th>
                  <th className="text-left px-3 py-2">Enabled</th>
                  <th className="text-right px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">{r.source}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.destination}</td>
                    <td className="px-3 py-2"><Badge variant="secondary">{r.statusCode}</Badge></td>
                    <td className="px-3 py-2 text-muted-foreground">{r.hits}</td>
                    <td className="px-3 py-2"><Switch checked={r.enabled} onCheckedChange={(v) => toggle(r.id, v)} /></td>
                    <td className="px-3 py-2 text-right">
                      <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── helpers ─────────────────────────────────────────────

function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-muted/30 border rounded-lg p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-medium text-sm mt-0.5 break-all">{value}</p>
    </div>
  )
}

function PanelSkeleton() {
  return (
    <Card>
      <CardContent className="p-10 flex items-center justify-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </CardContent>
    </Card>
  )
}
