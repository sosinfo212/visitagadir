'use client'

import { useEffect, useState } from 'react'
import {
  Megaphone, Settings, Plus, ToggleLeft, ToggleRight, Trash2,
  Edit2, ExternalLink, Eye, EyeOff, Code, LayoutGrid, Power, PowerOff,
  Save, AlertTriangle, CheckCircle2, X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'

interface AdPlacement {
  id: string
  name: string
  location: string
  slotId: string | null
  format: string
  adType: string
  enabled: boolean
  customHtml: string | null
  description: string | null
  position: number
}

interface AdSettings {
  id: string
  publisherId: string
  adsEnabled: boolean
  showPlaceholders: boolean
}

const formatOptions = [
  { value: 'auto', label: 'Auto' },
  { value: 'horizontal', label: 'Horizontal (728x90)' },
  { value: 'rectangle', label: 'Rectangle (300x250)' },
  { value: 'vertical', label: 'Vertical (160x600)' },
  { value: 'fluid', label: 'Fluid / In-feed' },
]

const adTypeOptions = [
  { value: 'adsense', label: 'Google AdSense' },
  { value: 'custom', label: 'Custom HTML' },
]

const locationLabels: Record<string, string> = {
  header_banner: 'Header Banner',
  featured_feed: 'Featured Feed',
  bottom_banner: 'Bottom Banner',
  category_banner: 'Category Banner',
  listings_feed: 'Listings Feed',
  article_inline: 'Article Inline',
  blog_content_inline: 'Blog Content Inline',
  sidebar_rectangle: 'Sidebar Rectangle',
  blog_list_sidebar: 'Blog List Sidebar',
  blog_list_feed: 'Blog List Feed',
}

function formatLabel(format: string) {
  return formatOptions.find(f => f.value === format)?.label || format
}

function adTypeLabel(type: string) {
  return adTypeOptions.find(t => t.value === type)?.label || type
}

export default function AdminAdsPage() {
  const [placements, setPlacements] = useState<AdPlacement[]>([])
  const [settings, setSettings] = useState<AdSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingPlacement, setEditingPlacement] = useState<AdPlacement | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [form, setForm] = useState({
    name: '',
    location: '',
    slotId: '',
    format: 'auto',
    adType: 'adsense',
    customHtml: '',
    description: '',
    position: 0,
  })

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    publisherId: '',
    adsEnabled: true,
    showPlaceholders: true,
  })

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/ads')
      if (res.ok) {
        const data = await res.json()
        setPlacements(data.placements)
        setSettings(data.settings)
        setSettingsForm({
          publisherId: data.settings.publisherId,
          adsEnabled: data.settings.adsEnabled,
          showPlaceholders: data.settings.showPlaceholders,
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleToggleEnabled = async (placement: AdPlacement) => {
    try {
      const res = await fetch(`/api/admin/ads/${placement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !placement.enabled }),
      })
      if (res.ok) {
        setPlacements(prev => prev.map(p =>
          p.id === placement.id ? { ...p, enabled: !p.enabled } : p
        ))
        showToast(`${placement.name} ${placement.enabled ? 'disabled' : 'enabled'}`)
      }
    } catch {
      showToast('Failed to update', 'error')
    }
  }

  const handleDelete = async (placement: AdPlacement) => {
    if (!confirm(`Delete "${placement.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/ads/${placement.id}`, { method: 'DELETE' })
      if (res.ok) {
        setPlacements(prev => prev.filter(p => p.id !== placement.id))
        showToast(`${placement.name} deleted`)
      }
    } catch {
      showToast('Failed to delete', 'error')
    }
  }

  const openEdit = (placement: AdPlacement) => {
    setEditingPlacement(placement)
    setForm({
      name: placement.name,
      location: placement.location,
      slotId: placement.slotId || '',
      format: placement.format,
      adType: placement.adType,
      customHtml: placement.customHtml || '',
      description: placement.description || '',
      position: placement.position,
    })
    setEditDialogOpen(true)
  }

  const openAdd = () => {
    setEditingPlacement(null)
    setForm({
      name: '',
      location: '',
      slotId: '',
      format: 'auto',
      adType: 'adsense',
      customHtml: '',
      description: '',
      position: placements.length + 1,
    })
    setAddDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingPlacement) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/ads/${editingPlacement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const updated = await res.json()
        setPlacements(prev => prev.map(p => p.id === editingPlacement.id ? updated : p))
        setEditDialogOpen(false)
        showToast('Placement updated')
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to update', 'error')
      }
    } catch {
      showToast('Failed to update', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNew = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const newPlacement = await res.json()
        setPlacements(prev => [...prev, newPlacement])
        setAddDialogOpen(false)
        showToast('Placement created')
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to create', 'error')
      }
    } catch {
      showToast('Failed to create', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/ads/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      })
      if (res.ok) {
        const updated = await res.json()
        setSettings(updated)
        setSettingsOpen(false)
        showToast('Settings saved')
      }
    } catch {
      showToast('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAds = async () => {
    if (!settings) return
    const newValue = !settings.adsEnabled
    try {
      const res = await fetch('/api/admin/ads/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adsEnabled: newValue }),
      })
      if (res.ok) {
        const updated = await res.json()
        setSettings(updated)
        setSettingsForm(prev => ({ ...prev, adsEnabled: updated.adsEnabled }))
        showToast(`Ads ${newValue ? 'enabled' : 'disabled'} globally`)
      }
    } catch {
      showToast('Failed to toggle', 'error')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Ad Management</h1>
        <div className="grid grid-cols-1 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-20 bg-gray-100 rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-orange-500" />
            Ad Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage Google AdSense placements and custom ads</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSettingsOpen(true) }}
            className="gap-1.5"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button
            size="sm"
            onClick={openAdd}
            className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Placement
          </Button>
        </div>
      </div>

      {/* Global Toggle + Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={`border-0 shadow-sm ${settings?.adsEnabled ? 'bg-green-50' : 'bg-red-50'}`}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings?.adsEnabled ? (
                <div className="p-2.5 rounded-xl bg-green-100"><Power className="h-5 w-5 text-green-600" /></div>
              ) : (
                <div className="p-2.5 rounded-xl bg-red-100"><PowerOff className="h-5 w-5 text-red-600" /></div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">Global Ad Status</p>
                <p className="text-xs text-muted-foreground">{settings?.adsEnabled ? 'All ads are active' : 'All ads are disabled'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleAds}
              className={settings?.adsEnabled ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
            >
              {settings?.adsEnabled ? 'Disable' : 'Enable'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-50"><LayoutGrid className="h-5 w-5 text-orange-600" /></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Active Placements</p>
                <p className="text-2xl font-bold">{placements.filter(p => p.enabled).length} / {placements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50"><Eye className="h-5 w-5 text-teal-600" /></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Show Placeholders</p>
                <p className="text-xs text-muted-foreground">{settings?.showPlaceholders ? 'Visible in dev mode' : 'Hidden when no ad'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Publisher ID */}
      {settings && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50"><ExternalLink className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">AdSense Publisher ID</p>
                  <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{settings.publisherId}</code>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)} className="text-blue-600 hover:text-blue-700">
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placements List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-gray-500" />
          Ad Placements
        </h2>

        {placements.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-10 text-center">
              <Megaphone className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="text-muted-foreground">No ad placements yet. Click &ldquo;Add Placement&rdquo; to get started.</p>
            </CardContent>
          </Card>
        ) : (
          placements.map((placement) => (
            <Card key={placement.id} className={`border-0 shadow-sm transition-all ${!placement.enabled ? 'opacity-60' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`p-2.5 rounded-xl shrink-0 ${placement.enabled ? 'bg-orange-50' : 'bg-gray-50'}`}>
                      {placement.adType === 'custom' ? (
                        <Code className={`h-5 w-5 ${placement.enabled ? 'text-orange-600' : 'text-gray-400'}`} />
                      ) : (
                        <Megaphone className={`h-5 w-5 ${placement.enabled ? 'text-orange-600' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{placement.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {locationLabels[placement.location] || placement.location}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${placement.enabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                          {placement.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      {placement.description && (
                        <p className="text-xs text-muted-foreground mt-1">{placement.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          Type: <span className="font-medium text-gray-700">{adTypeLabel(placement.adType)}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Format: <span className="font-medium text-gray-700">{formatLabel(placement.format)}</span>
                        </span>
                        {placement.slotId && (
                          <span className="text-xs text-muted-foreground">
                            Slot: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{placement.slotId}</code>
                          </span>
                        )}
                      </div>
                      {placement.adType === 'custom' && placement.customHtml && (
                        <details className="mt-2">
                          <summary className="text-xs text-orange-600 cursor-pointer hover:underline">View custom HTML</summary>
                          <pre className="mt-1 text-xs bg-gray-50 border rounded-lg p-3 overflow-x-auto max-h-32">
                            <code>{placement.customHtml.substring(0, 300)}{placement.customHtml.length > 300 ? '...' : ''}</code>
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleEnabled(placement)}
                      className={placement.enabled ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}
                      title={placement.enabled ? 'Disable' : 'Enable'}
                    >
                      {placement.enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(placement)} className="text-gray-500 hover:text-gray-700">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(placement)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Guide */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-teal-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Quick Guide: Setting Up Google AdSense
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <p className="font-medium text-gray-900">1. Get Your Publisher ID</p>
              <p className="text-muted-foreground">Sign up at google.com/adsense. Find your publisher ID (ca-pub-XXXXXXX) in your account settings.</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-gray-900">2. Create Ad Units</p>
              <p className="text-muted-foreground">Create ad units in AdSense dashboard. Copy each ad slot ID and paste it into the placements above.</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-gray-900">3. Update Publisher ID</p>
              <p className="text-muted-foreground">Click Settings above and replace the placeholder publisher ID with your real one. Ads will start showing within minutes.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-500" />
              Ad Settings
            </DialogTitle>
            <DialogDescription>Configure your Google AdSense integration and global ad behavior.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>AdSense Publisher ID</Label>
              <Input
                value={settingsForm.publisherId}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, publisherId: e.target.value }))}
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Find this in your Google AdSense account under Account Settings.</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <Label className="text-sm font-medium">Enable Ads Globally</Label>
                <p className="text-xs text-muted-foreground">Turn off to disable all ads across the site</p>
              </div>
              <button
                onClick={() => setSettingsForm(prev => ({ ...prev, adsEnabled: !prev.adsEnabled }))}
                className="focus:outline-none"
              >
                {settingsForm.adsEnabled ? (
                  <ToggleRight className="h-8 w-8 text-green-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <Label className="text-sm font-medium">Show Placeholders</Label>
                <p className="text-xs text-muted-foreground">Display placeholder boxes when ads haven&apos;t loaded</p>
              </div>
              <button
                onClick={() => setSettingsForm(prev => ({ ...prev, showPlaceholders: !prev.showPlaceholders }))}
                className="focus:outline-none"
              >
                {settingsForm.showPlaceholders ? (
                  <ToggleRight className="h-8 w-8 text-green-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings} disabled={saving} className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white">
              {saving ? 'Saving...' : <><Save className="h-4 w-4 mr-1.5" />Save Settings</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit/Add Placement Dialog */}
      <Dialog open={editDialogOpen || addDialogOpen} onOpenChange={(open) => {
        if (!open) { setEditDialogOpen(false); setAddDialogOpen(false) }
      }}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-orange-500" />
              {editingPlacement ? 'Edit Placement' : 'Add Ad Placement'}
            </DialogTitle>
            <DialogDescription>
              {editingPlacement ? 'Update this ad placement configuration.' : 'Create a new ad placement for your site.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Placement Name <span className="text-red-500">*</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Header Banner"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Location Key <span className="text-red-500">*</span></Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. header_banner"
                  disabled={!!editingPlacement}
                  className="font-mono text-sm"
                />
                {editingPlacement && <p className="text-xs text-muted-foreground">Location key cannot be changed</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ad Type</Label>
                <Select value={form.adType} onValueChange={(v) => setForm(prev => ({ ...prev, adType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {adTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ad Format</Label>
                <Select value={form.format} onValueChange={(v) => setForm(prev => ({ ...prev, format: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {formatOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.adType === 'adsense' && (
              <div className="space-y-1.5">
                <Label>Ad Slot ID</Label>
                <Input
                  value={form.slotId}
                  onChange={(e) => setForm(prev => ({ ...prev, slotId: e.target.value }))}
                  placeholder="e.g. 1234567890"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Find this in your AdSense dashboard when creating an ad unit.</p>
              </div>
            )}

            {form.adType === 'custom' && (
              <div className="space-y-1.5">
                <Label>Custom HTML</Label>
                <Textarea
                  value={form.customHtml}
                  onChange={(e) => setForm(prev => ({ ...prev, customHtml: e.target.value }))}
                  placeholder="Paste your custom ad HTML here..."
                  className="font-mono text-sm min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground">Supports any HTML/JS code for custom ads or affiliate banners.</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of where this ad appears"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Position (sort order)</Label>
              <Input
                type="number"
                value={form.position}
                onChange={(e) => setForm(prev => ({ ...prev, position: parseInt(e.target.value) || 0 }))}
                min={0}
                className="w-24"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setAddDialogOpen(false) }}>Cancel</Button>
            <Button
              onClick={editingPlacement ? handleSaveEdit : handleSaveNew}
              disabled={saving || !form.name || !form.location}
              className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white"
            >
              {saving ? 'Saving...' : <><Save className="h-4 w-4 mr-1.5" />{editingPlacement ? 'Update' : 'Create'}</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
