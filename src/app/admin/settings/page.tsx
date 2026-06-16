'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Settings, Save, Loader2, CheckCircle2, AlertCircle, Lock, User, Globe, FileCode, RefreshCw, ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { FeaturedImageInput } from '@/components/admin/featured-image-input'

interface AppSettingsForm {
  siteName: string
  siteLogoUrl: string
  siteLogoWidth: number
  siteLogoHeight: number
  faviconUrl: string
  footerLogoUrl: string
  footerLogoWidth: number
  footerLogoHeight: number
  adminName: string
  adminEmail: string
  hasCustomPassword: boolean
}

interface ListingsXmlStatus {
  feedUrl: string
  fileExists: boolean
  listingCount: number
  generatedAt: string | null
  fileSize: number | null
  livePublishedCount: number
}

const EMPTY_FORM: AppSettingsForm = {
  siteName: '',
  siteLogoUrl: '/agadir-logo.png',
  siteLogoWidth: 32,
  siteLogoHeight: 32,
  faviconUrl: '/agadir-logo.png',
  footerLogoUrl: '/agadir-logo.png',
  footerLogoWidth: 32,
  footerLogoHeight: 32,
  adminName: '',
  adminEmail: '',
  hasCustomPassword: false,
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<AppSettingsForm>(EMPTY_FORM)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [xmlStatus, setXmlStatus] = useState<ListingsXmlStatus | null>(null)
  const [xmlLoading, setXmlLoading] = useState(true)
  const [xmlRegenerating, setXmlRegenerating] = useState(false)
  const [xmlMessage, setXmlMessage] = useState('')
  const [xmlError, setXmlError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error('Failed to load settings')
      const data = await res.json()
      setForm(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loadXmlStatus = useCallback(async () => {
    setXmlLoading(true)
    setXmlError('')
    try {
      const res = await fetch('/api/admin/listings/xml')
      if (!res.ok) throw new Error('Failed to load listings XML status')
      setXmlStatus(await res.json())
    } catch (e) {
      setXmlError(e instanceof Error ? e.message : 'Failed to load listings XML status')
    } finally {
      setXmlLoading(false)
    }
  }, [])

  useEffect(() => {
    loadXmlStatus()
  }, [loadXmlStatus])

  async function handleRegenerateListingsXml() {
    setXmlRegenerating(true)
    setXmlError('')
    setXmlMessage('')
    try {
      const res = await fetch('/api/admin/listings/xml', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to regenerate listings XML')

      setXmlStatus(data)
      setXmlMessage(`Regenerated ${data.listingCount} published listing${data.listingCount === 1 ? '' : 's'}.`)
    } catch (e) {
      setXmlError(e instanceof Error ? e.message : 'Failed to regenerate listings XML')
    } finally {
      setXmlRegenerating(false)
    }
  }

  function formatXmlDate(value: string | null) {
    if (!value) return 'Never'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString()
  }

  function formatFileSize(bytes: number | null) {
    if (bytes == null) return '—'
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  function setField<K extends keyof AppSettingsForm>(key: K, value: AppSettingsForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setStatus('idle')
    setError('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setStatus('idle')
    setError('')

    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        setError('Enter your current password to change it.')
        setStatus('error')
        setSaving(false)
        return
      }
      if (newPassword.length < 8) {
        setError('New password must be at least 8 characters.')
        setStatus('error')
        setSaving(false)
        return
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirmation do not match.')
        setStatus('error')
        setSaving(false)
        return
      }
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: form.siteName,
          siteLogoUrl: form.siteLogoUrl,
          siteLogoWidth: form.siteLogoWidth,
          siteLogoHeight: form.siteLogoHeight,
          faviconUrl: form.faviconUrl,
          footerLogoUrl: form.footerLogoUrl,
          footerLogoWidth: form.footerLogoWidth,
          footerLogoHeight: form.footerLogoHeight,
          adminName: form.adminName,
          adminEmail: form.adminEmail,
          ...(newPassword
            ? { currentPassword, newPassword }
            : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save settings')

      setForm(data)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings')
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading settings...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-7 w-7 text-orange-600" />
          App Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your site branding, logo, and administrator account.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Site branding */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-teal-600" />
              Site Branding
            </CardTitle>
            <CardDescription>
              Update the website name and logo shown across the directory.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="siteName">Website name</Label>
              <Input
                id="siteName"
                value={form.siteName}
                onChange={(e) => setField('siteName', e.target.value)}
                placeholder="Agadir Directory"
              />
            </div>

            <FeaturedImageInput
              label="Header logo"
              hint="Shown in the site header navigation."
              value={form.siteLogoUrl}
              onChange={(url) => setField('siteLogoUrl', url)}
              variant="icon"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logoWidth">Header logo width (px)</Label>
                <Input
                  id="logoWidth"
                  type="number"
                  min={16}
                  max={512}
                  value={form.siteLogoWidth}
                  onChange={(e) => setField('siteLogoWidth', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoHeight">Header logo height (px)</Label>
                <Input
                  id="logoHeight"
                  type="number"
                  min={16}
                  max={512}
                  value={form.siteLogoHeight}
                  onChange={(e) => setField('siteLogoHeight', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4 flex items-center gap-4">
              <img
                src={form.siteLogoUrl || '/agadir-logo.png'}
                alt={form.siteName}
                width={form.siteLogoWidth}
                height={form.siteLogoHeight}
                className="rounded-lg object-contain bg-white border shrink-0"
                style={{ width: form.siteLogoWidth, height: form.siteLogoHeight }}
              />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Header preview</p>
                <p className="font-semibold text-gray-900">{form.siteName || 'Website name'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {form.siteLogoWidth} × {form.siteLogoHeight} px
                </p>
              </div>
            </div>

            <Separator />

            <FeaturedImageInput
              label="Favicon"
              hint="Browser tab icon. Square image recommended (32×32 or 64×64). PNG, ICO, or SVG."
              value={form.faviconUrl}
              onChange={(url) => setField('faviconUrl', url)}
              variant="icon"
            />

            <div className="rounded-xl border bg-gray-50 p-4 flex items-center gap-4">
              <img
                src={form.faviconUrl || '/agadir-logo.png'}
                alt="Favicon preview"
                width={32}
                height={32}
                className="rounded object-contain bg-white border shrink-0"
                style={{ width: 32, height: 32 }}
              />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Favicon preview</p>
                <p className="text-sm text-gray-700">Shown in the browser tab</p>
              </div>
            </div>

            <Separator />

            <FeaturedImageInput
              label="Footer logo"
              hint="Logo displayed in the site footer."
              value={form.footerLogoUrl}
              onChange={(url) => setField('footerLogoUrl', url)}
              variant="icon"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="footerLogoWidth">Footer logo width (px)</Label>
                <Input
                  id="footerLogoWidth"
                  type="number"
                  min={16}
                  max={512}
                  value={form.footerLogoWidth}
                  onChange={(e) => setField('footerLogoWidth', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footerLogoHeight">Footer logo height (px)</Label>
                <Input
                  id="footerLogoHeight"
                  type="number"
                  min={16}
                  max={512}
                  value={form.footerLogoHeight}
                  onChange={(e) => setField('footerLogoHeight', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="rounded-xl border bg-gray-900 p-4 flex items-center gap-4">
              <img
                src={form.footerLogoUrl || '/agadir-logo.png'}
                alt={form.siteName}
                width={form.footerLogoWidth}
                height={form.footerLogoHeight}
                className="rounded-lg object-contain shrink-0"
                style={{ width: form.footerLogoWidth, height: form.footerLogoHeight }}
              />
              <div>
                <p className="text-xs text-gray-400 mb-1">Footer preview</p>
                <p className="font-semibold text-white">{form.siteName || 'Website name'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {form.footerLogoWidth} × {form.footerLogoHeight} px
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCode className="h-4 w-4 text-blue-600" />
              Listings XML feed
            </CardTitle>
            <CardDescription>
              Published listings are exported to <code className="text-xs bg-muted px-1 py-0.5 rounded">/listings.xml</code>.
              The live feed also rebuilds from the database on each request; use regenerate to refresh the saved file immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {xmlLoading ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading feed status...
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border bg-muted/20 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Published listings</p>
                  <p className="font-medium">{xmlStatus?.livePublishedCount ?? '—'}</p>
                </div>
                <div className="rounded-lg border bg-muted/20 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Last saved file</p>
                  <p className="font-medium">{formatXmlDate(xmlStatus?.generatedAt ?? null)}</p>
                </div>
                <div className="rounded-lg border bg-muted/20 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Saved file size</p>
                  <p className="font-medium">{formatFileSize(xmlStatus?.fileSize ?? null)}</p>
                </div>
                <div className="rounded-lg border bg-muted/20 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Feed URL</p>
                  <a
                    href={xmlStatus?.feedUrl || '/listings.xml'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-orange-600 hover:underline inline-flex items-center gap-1"
                  >
                    Open feed
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}

            {xmlMessage && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {xmlMessage}
              </div>
            )}

            {xmlError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {xmlError}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handleRegenerateListingsXml}
              disabled={xmlRegenerating || xmlLoading}
            >
              {xmlRegenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate listings XML
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Admin account */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-orange-600" />
              Administrator Account
            </CardTitle>
            <CardDescription>
              Update your profile and login password for the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminName">Your name</Label>
                <Input
                  id="adminName"
                  value={form.adminName}
                  onChange={(e) => setField('adminName', e.target.value)}
                  placeholder="Administrator"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) => setField('adminEmail', e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Change password</p>
                {!form.hasCustomPassword && (
                  <span className="text-xs text-muted-foreground">(currently using default/env password)</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Settings saved successfully.
          </div>
        )}

        <Button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save settings
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
