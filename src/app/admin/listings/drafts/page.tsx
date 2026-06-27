'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Loader2,
  Pencil,
  ScanSearch,
  Search,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiImageInput } from '@/components/multi-image-input'

interface Category {
  id: string
  name: string
  slug: string
}

interface Listing {
  id: string
  name: string
  slug: string
  description: string
  address: string
  phone: string | null
  website: string | null
  email: string | null
  image: string | null
  images: string[]
  featured: boolean
  published: boolean
  categoryId: string
  category: { name: string; slug: string; icon: string }
  createdAt: string
}

interface ListingsResponse {
  items: Listing[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface ScanResult {
  scanned: number
  affectedCount: number
  drafted: number
  message: string
  affected: Array<{
    id: string
    name: string
    brokenUrls: string[]
    imageCount: number
    drafted: boolean
  }>
}

interface ListingForm {
  name: string
  description: string
  address: string
  phone: string
  website: string
  email: string
  images: string[]
  categoryId: string
  featured: boolean
  published: boolean
}

const PAGE_SIZE = 25

const emptyForm: ListingForm = {
  name: '',
  description: '',
  address: '',
  phone: '',
  website: '',
  email: '',
  images: [],
  categoryId: '',
  featured: false,
  published: false,
}

export default function ListingDraftsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanError, setScanError] = useState('')
  const [brokenByListingId, setBrokenByListingId] = useState<Record<string, string[]>>({})
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [form, setForm] = useState<ListingForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchDrafts = useCallback(async () => {
    const params = new URLSearchParams()
    params.set('published', 'false')
    if (appliedSearch) params.set('search', appliedSearch)
    params.set('page', String(page))
    params.set('limit', String(PAGE_SIZE))
    const res = await fetch(`/api/admin/listings?${params}`)
    if (!res.ok) return
    const data: ListingsResponse = await res.json()
    setListings(data.items)
    setTotal(data.total)
    setTotalPages(data.totalPages)
    setPage(data.page)
  }, [appliedSearch, page])

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCategories(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchDrafts().finally(() => setLoading(false))
  }, [fetchDrafts])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedSearch(searchInput.trim())
      setPage(1)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  function applySearchNow() {
    setAppliedSearch(searchInput.trim())
    setPage(1)
  }

  async function handleScanBrokenImages() {
    setScanning(true)
    setScanError('')
    setScanResult(null)
    try {
      const res = await fetch('/api/admin/listings/scan-broken-images', { method: 'POST' })
      const data: ScanResult & { error?: string } = await res.json()
      if (!res.ok) {
        setScanError(data.error || 'Scan failed.')
        return
      }
      setScanResult(data)
      const nextBroken: Record<string, string[]> = {}
      for (const row of data.affected) {
        nextBroken[row.id] = row.brokenUrls
      }
      setBrokenByListingId(nextBroken)
      await fetchDrafts()
    } catch {
      setScanError('Scan failed. Please try again.')
    } finally {
      setScanning(false)
    }
  }

  function handleEdit(listing: Listing) {
    const imgs =
      Array.isArray(listing.images) && listing.images.length > 0
        ? listing.images
        : listing.image
          ? [listing.image]
          : []
    setSelectedListing(listing)
    setForm({
      name: listing.name,
      description: listing.description,
      address: listing.address,
      phone: listing.phone || '',
      website: listing.website || '',
      email: listing.email || '',
      images: imgs,
      categoryId: listing.categoryId,
      featured: listing.featured,
      published: listing.published,
    })
    setEditDialogOpen(true)
  }

  async function handleSave() {
    if (!selectedListing) return
    setSaving(true)
    try {
      const body = {
        ...form,
        phone: form.phone || null,
        website: form.website || null,
        email: form.email || null,
        images: form.images,
      }
      const res = await fetch(`/api/admin/listings/${selectedListing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Save failed')
      setEditDialogOpen(false)
      setSelectedListing(null)
      if (form.published) {
        setBrokenByListingId((prev) => {
          const next = { ...prev }
          delete next[selectedListing.id]
          return next
        })
      }
      await fetchDrafts()
    } catch {
      // keep dialog open for retry
    } finally {
      setSaving(false)
    }
  }

  function brokenLabel(listing: Listing) {
    const broken = brokenByListingId[listing.id]
    if (broken) {
      if (broken.length === 0) return 'No images'
      return `${broken.length} broken`
    }
    const count = listing.images?.length ?? (listing.image ? 1 : 0)
    if (count === 0) return 'No images'
    return '—'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Listing Drafts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unpublished listings hidden from the public site. Fix images here, then publish again.
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScanSearch className="h-5 w-5" />
            Scan broken images
          </CardTitle>
          <CardDescription>
            Checks every listing image (cover and gallery). Listings with missing or unreachable images are moved to drafts
            (unpublished).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleScanBrokenImages} disabled={scanning}>
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning all listings…
              </>
            ) : (
              <>
                <ImageOff className="h-4 w-4 mr-2" />
                Scan all listings for broken images
              </>
            )}
          </Button>
          {scanError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{scanError}</p>
          )}
          {scanResult && (
            <div className="text-sm bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 space-y-2">
              <p className="font-medium text-amber-900">{scanResult.message}</p>
              <p className="text-amber-800">
                Scanned {scanResult.scanned} listings · {scanResult.affectedCount} with image issues · {scanResult.drafted}{' '}
                newly unpublished
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              applySearchNow()
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search draft listings…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
          {!loading && (
            <p className="text-xs text-muted-foreground mt-3">
              {total === 0
                ? 'No draft listings'
                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} drafts`}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No draft listings</p>
              <p className="text-xs mt-1">Run the scan above to unpublish listings with broken images.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Image issue</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => {
                    const featuredImage = listing.images?.[0] || listing.image
                    const broken = brokenByListingId[listing.id]
                    const hasIssue =
                      broken !== undefined ? broken.length > 0 || listing.images.length === 0 : listing.images.length === 0
                    return (
                      <TableRow key={listing.id}>
                        <TableCell>
                          {featuredImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={featuredImage}
                              alt=""
                              className="h-10 w-14 rounded object-cover border bg-muted"
                            />
                          ) : (
                            <div className="h-10 w-14 rounded border bg-muted flex items-center justify-center text-muted-foreground">
                              <ImageOff className="h-4 w-4" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{listing.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-48">{listing.address}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {listing.category.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={hasIssue ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {brokenLabel(listing)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(listing)}>
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit {listing.name}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && listings.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit draft listing</DialogTitle>
            <DialogDescription>Update details and images, then publish when ready.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Address *</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Images</Label>
              <MultiImageInput value={form.images} onChange={(next) => setForm({ ...form, images: next })} />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
                <Label>Published</Label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.name || !form.categoryId || !form.description || !form.address}
                className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white"
              >
                {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Save changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
