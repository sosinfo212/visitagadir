'use client'

import { useEffect, useState } from 'react'
import {
  Code2, Plus, Trash2, Edit2, Save, X, CheckCircle2, AlertTriangle,
  Facebook, BarChart3, Search, Tag, FileCode, ExternalLink, FileText,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Pixel {
  id: string
  type: string
  name: string
  pixelId: string | null
  customCode: string | null
  enabled: boolean
  position: number
}

type PixelType = 'facebook' | 'tiktok' | 'ga4' | 'gtm' | 'gsc' | 'custom_head' | 'custom_body'

const PIXEL_TYPES: {
  value: PixelType
  label: string
  description: string
  placeholder: string
  helpUrl: string
  usesCode?: boolean
  icon: React.ReactNode
  color: string
}[] = [
  {
    value: 'facebook',
    label: 'Facebook Pixel',
    description: 'Meta / Facebook conversion tracking pixel.',
    placeholder: 'e.g. 1234567890123456',
    helpUrl: 'https://www.facebook.com/business/help/952192354843755',
    icon: <Facebook className="h-4 w-4" />,
    color: 'from-blue-600 to-blue-700',
  },
  {
    value: 'tiktok',
    label: 'TikTok Pixel',
    description: 'TikTok Ads conversion tracking pixel.',
    placeholder: 'e.g. C4XXXXXXXXXXXXXXXXXX',
    helpUrl: 'https://ads.tiktok.com/help/article/get-started-pixel',
    icon: <BarChart3 className="h-4 w-4" />,
    color: 'from-pink-500 to-rose-600',
  },
  {
    value: 'ga4',
    label: 'Google Analytics (GA4)',
    description: 'GA4 measurement ID for site analytics.',
    placeholder: 'e.g. G-XXXXXXXXXX',
    helpUrl: 'https://support.google.com/analytics/answer/9539598',
    icon: <BarChart3 className="h-4 w-4" />,
    color: 'from-orange-500 to-amber-500',
  },
  {
    value: 'gtm',
    label: 'Google Tag Manager',
    description: 'GTM container ID. Manage other tags from inside GTM.',
    placeholder: 'e.g. GTM-XXXXXXX',
    helpUrl: 'https://support.google.com/tagmanager/answer/6103696',
    icon: <Tag className="h-4 w-4" />,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    value: 'gsc',
    label: 'Google Search Console',
    description: 'Site verification meta tag content value.',
    placeholder: 'e.g. abc123xyz_verification_code',
    helpUrl: 'https://search.google.com/search-console',
    icon: <Search className="h-4 w-4" />,
    color: 'from-indigo-500 to-purple-600',
  },
  {
    value: 'custom_head',
    label: 'Custom HTML (<head>)',
    description: 'Raw HTML / scripts to inject inside <head>.',
    placeholder: '',
    helpUrl: '',
    usesCode: true,
    icon: <FileCode className="h-4 w-4" />,
    color: 'from-slate-600 to-gray-700',
  },
  {
    value: 'custom_body',
    label: 'Custom HTML (<body>)',
    description: 'Raw HTML / scripts to inject at end of <body>.',
    placeholder: '',
    helpUrl: '',
    usesCode: true,
    icon: <FileCode className="h-4 w-4" />,
    color: 'from-slate-600 to-gray-700',
  },
]

function getTypeMeta(type: string) {
  return PIXEL_TYPES.find(t => t.value === type) || {
    value: type as PixelType,
    label: type,
    description: '',
    placeholder: '',
    helpUrl: '',
    usesCode: false,
    icon: <Code2 className="h-4 w-4" />,
    color: 'from-gray-500 to-gray-600',
  }
}

const emptyForm = {
  type: 'facebook' as PixelType,
  name: '',
  pixelId: '',
  customCode: '',
  enabled: true,
  position: 0,
}

export default function AdminPixelsPage() {
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Pixel | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [adsTxt, setAdsTxt] = useState('')
  const [adsTxtLoading, setAdsTxtLoading] = useState(true)
  const [adsTxtSaving, setAdsTxtSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchPixels = async () => {
    try {
      const res = await fetch('/api/admin/pixels')
      if (res.ok) {
        const data = await res.json()
        setPixels(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAdsTxt = async () => {
    try {
      const res = await fetch('/api/admin/pixels/ads-txt')
      if (res.ok) {
        const data = await res.json()
        setAdsTxt(data.content || '')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAdsTxtLoading(false)
    }
  }

  useEffect(() => {
    fetchPixels()
    fetchAdsTxt()
  }, [])

  const handleSaveAdsTxt = async () => {
    setAdsTxtSaving(true)
    try {
      const res = await fetch('/api/admin/pixels/ads-txt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: adsTxt }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save ads.txt')
      }
      const data = await res.json()
      setAdsTxt(data.content || '')
      showToast('ads.txt saved')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save ads.txt', 'error')
    } finally {
      setAdsTxtSaving(false)
    }
  }

  const handleNew = () => {
    setEditing(null)
    setIsNew(true)
    setForm({ ...emptyForm, position: pixels.length })
    setEditDialogOpen(true)
  }

  const handleEdit = (pixel: Pixel) => {
    setEditing(pixel)
    setIsNew(false)
    setForm({
      type: pixel.type as PixelType,
      name: pixel.name,
      pixelId: pixel.pixelId || '',
      customCode: pixel.customCode || '',
      enabled: pixel.enabled,
      position: pixel.position,
    })
    setEditDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        type: form.type,
        name: form.name,
        pixelId: form.pixelId || null,
        customCode: form.customCode || null,
        enabled: form.enabled,
        position: form.position,
      }

      if (isNew) {
        const res = await fetch('/api/admin/pixels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to create pixel')
        }
        showToast('Pixel created')
      } else if (editing) {
        const res = await fetch(`/api/admin/pixels/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Failed to update pixel')
        showToast('Pixel updated')
      }

      await fetchPixels()
      setEditDialogOpen(false)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (pixel: Pixel) => {
    try {
      const res = await fetch(`/api/admin/pixels/${pixel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !pixel.enabled }),
      })
      if (res.ok) {
        setPixels(prev => prev.map(p => (p.id === pixel.id ? { ...p, enabled: !p.enabled } : p)))
        showToast(`${pixel.name} ${!pixel.enabled ? 'enabled' : 'disabled'}`)
      }
    } catch {
      showToast('Failed to toggle', 'error')
    }
  }

  const handleDelete = async () => {
    if (!editing) return
    try {
      const res = await fetch(`/api/admin/pixels/${editing.id}`, { method: 'DELETE' })
      if (res.ok) {
        setPixels(prev => prev.filter(p => p.id !== editing.id))
        showToast('Pixel deleted')
      }
    } catch {
      showToast('Failed to delete', 'error')
    } finally {
      setDeleteDialogOpen(false)
      setEditing(null)
    }
  }

  const currentTypeMeta = getTypeMeta(form.type)
  const enabledCount = pixels.filter(p => p.enabled).length

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Tracking Pixels</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-24 bg-gray-100 rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Code2 className="h-6 w-6 text-orange-500" />
            Tracking Pixels
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage marketing & analytics pixels injected into the public site.
            Currently <span className="font-semibold text-foreground">{enabledCount}</span> of {pixels.length} active.
          </p>
        </div>
        <Button onClick={handleNew} className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Pixel
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">How this works</p>
          <p>Pixels are injected client-side into every page of the public website on first load. Enable a pixel and enter its ID to start collecting data. Changes propagate within ~30 seconds (response cache).</p>
        </div>
      </div>

      {/* ads.txt */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                ads.txt
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Manage your site&apos;s <code className="text-xs bg-muted px-1 py-0.5 rounded">/ads.txt</code> file for ad network authorization (Google AdSense, etc.). One line per authorized seller.
              </p>
            </div>
            <a
              href="/ads.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:underline shrink-0"
            >
              View live file
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {adsTxtLoading ? (
            <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <>
              <Textarea
                value={adsTxt}
                onChange={(e) => setAdsTxt(e.target.value)}
                placeholder={'google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0'}
                className="font-mono text-sm min-h-[160px]"
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">
                Example: <code className="bg-muted px-1 py-0.5 rounded">google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0</code>
              </p>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveAdsTxt}
                  disabled={adsTxtSaving}
                  className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white"
                >
                  {adsTxtSaving ? 'Saving…' : (
                    <>
                      <Save className="h-4 w-4 mr-1.5" />
                      Save ads.txt
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pixel list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pixels.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="p-10 text-center">
              <Code2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-1">No pixels yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Add your first tracking pixel to start collecting analytics.</p>
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add Pixel
              </Button>
            </CardContent>
          </Card>
        ) : (
          pixels.map((pixel) => {
            const meta = getTypeMeta(pixel.type)
            const hasValue = meta.usesCode ? !!pixel.customCode : !!pixel.pixelId
            return (
              <Card key={pixel.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${meta.color} text-white flex items-center justify-center`}>
                      {meta.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-gray-900 truncate">{pixel.name}</h3>
                        {pixel.enabled ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] py-0">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200 text-[10px] py-0">Disabled</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{meta.label}</p>
                    </div>
                    <Switch
                      checked={pixel.enabled}
                      onCheckedChange={() => handleToggle(pixel)}
                      aria-label={`Toggle ${pixel.name}`}
                    />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-3 font-mono text-xs break-all min-h-[44px] flex items-center">
                    {hasValue ? (
                      meta.usesCode ? (
                        <span className="text-gray-700 line-clamp-2">{pixel.customCode}</span>
                      ) : (
                        <span className="text-gray-700">{pixel.pixelId}</span>
                      )
                    ) : (
                      <span className="text-amber-600 not-italic font-sans flex items-center gap-1.5 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        No value configured — pixel will not fire.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(pixel)} className="h-8 text-xs">
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <div className="flex items-center gap-1">
                      {meta.helpUrl && (
                        <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-muted-foreground">
                          <a href={meta.helpUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            Docs
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => { setEditing(pixel); setDeleteDialogOpen(true) }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentTypeMeta.color} text-white flex items-center justify-center`}>
                {currentTypeMeta.icon}
              </div>
              {isNew ? 'Add Tracking Pixel' : 'Edit Pixel'}
            </DialogTitle>
            <DialogDescription>{currentTypeMeta.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => {
                  const type = v as PixelType
                  const meta = getTypeMeta(type)
                  setForm(prev => ({
                    ...prev,
                    type,
                    name: prev.name || meta.label,
                  }))
                }}
                disabled={!isNew}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PIXEL_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        {t.icon}
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isNew && <p className="text-xs text-muted-foreground">Type can&apos;t be changed after creation.</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Display Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Main Facebook Pixel"
              />
            </div>

            {!currentTypeMeta.usesCode && (
              <div className="space-y-1.5">
                <Label className="text-sm">
                  {form.type === 'gsc' ? 'Verification Code' : 'Pixel / Measurement ID'}
                </Label>
                <Input
                  value={form.pixelId}
                  onChange={(e) => setForm(prev => ({ ...prev, pixelId: e.target.value }))}
                  placeholder={currentTypeMeta.placeholder}
                  className="font-mono"
                />
                {currentTypeMeta.helpUrl && (
                  <a
                    href={currentTypeMeta.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-600 hover:underline inline-flex items-center gap-1"
                  >
                    Where do I find this? <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            {(currentTypeMeta.usesCode || form.type === 'gsc') && (
              <div className="space-y-1.5">
                <Label className="text-sm">
                  {currentTypeMeta.usesCode ? 'HTML / Script' : 'Or paste full <meta> tag (optional)'}
                </Label>
                <Textarea
                  value={form.customCode}
                  onChange={(e) => setForm(prev => ({ ...prev, customCode: e.target.value }))}
                  placeholder={currentTypeMeta.usesCode
                    ? '<script>console.log("hello");</script>'
                    : '<meta name="google-site-verification" content="..." />'}
                  rows={6}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  ⚠️ Raw HTML is injected as-is into the page. Only paste code you trust.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
              <div>
                <Label className="text-sm font-medium">Enabled</Label>
                <p className="text-xs text-muted-foreground">Inject this pixel into the public site.</p>
              </div>
              <Switch
                checked={form.enabled}
                onCheckedChange={(v) => setForm(prev => ({ ...prev, enabled: v }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <Button variant="ghost" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name}
              className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white"
            >
              {saving ? 'Saving...' : <><Save className="h-4 w-4 mr-1" /> {isNew ? 'Create' : 'Save'}</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete pixel?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <span className="font-semibold">{editing?.name}</span>. It will stop firing on the public site immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}
    </div>
  )
}
