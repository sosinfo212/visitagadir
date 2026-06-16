'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Building2, Search, Plus, Pencil, Trash2, Star, ToggleLeft, ToggleRight, Loader2,
  ChevronDown, ChevronRight, ChevronLeft, Search as SearchIcon, MapPin, Clock, Upload, Files, ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MultiImageInput } from '@/components/multi-image-input'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  description: string | null
}

interface OpeningHourRow {
  dayOfWeek: string[]
  opens: string
  closes: string
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
  rating: number
  reviewCount: number
  featured: boolean
  published: boolean
  categoryId: string
  category: { name: string; slug: string; icon: string; defaultSchemaType?: string | null }
  createdAt: string
  // SEO / location / schema
  city?: string
  region?: string | null
  postalCode?: string | null
  country?: string
  latitude?: number | null
  longitude?: number | null
  openingHours?: string | null
  priceRange?: string | null
  seoTitle?: string | null
  metaDescription?: string | null
  metaKeywords?: string | null
  canonicalUrl?: string | null
  schemaType?: string | null
  logo?: string | null
}

interface ListingsResponse {
  items: Listing[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface ListingImportResult {
  listingsImported: number
  listingsSkipped: number
  listingsFailed: number
  categoriesCreated: number
  mediaDownloaded: number
  mediaFailed: number
  errors: string[]
  message?: string
}

interface DuplicateListingSummary {
  id: string
  name: string
  slug: string
  phone: string | null
  address: string
  published: boolean
  category: { name: string }
}

interface DuplicateGroup {
  type: 'name' | 'phone'
  key: string
  displayKey: string
  listings: DuplicateListingSummary[]
}

interface DuplicatesResponse {
  groups: DuplicateGroup[]
  groupCount: number
  duplicateListingCount: number
}

const PAGE_SIZE = 25

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
  // SEO / location / schema
  city: string
  region: string
  postalCode: string
  country: string
  latitude: string
  longitude: string
  priceRange: string
  openingHours: OpeningHourRow[]
  seoTitle: string
  metaDescription: string
  metaKeywords: string
  canonicalUrl: string
  schemaType: string
  logo: string
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3 w-3 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

const emptyForm: ListingForm = {
  name: '', description: '', address: '', phone: '', website: '', email: '',
  images: [], categoryId: '', featured: false, published: true,
  city: 'Agadir', region: '', postalCode: '', country: 'MA',
  latitude: '', longitude: '', priceRange: '', openingHours: [],
  seoTitle: '', metaDescription: '', metaKeywords: '', canonicalUrl: '',
  schemaType: '', logo: '',
}

// Friendly schema-type catalog mirroring lib/seo/types.ts. Kept inline so the
// admin form can render the select without an extra round-trip — the API layer
// re-validates with the canonical list before persisting.
const SCHEMA_TYPES: Array<{ label: string; value: string }> = [
  { label: '(use category default)', value: '' },
  { label: 'Local Business (generic)', value: 'LocalBusiness' },
  { label: 'Beauty Salon', value: 'BeautySalon' },
  { label: 'Day Spa', value: 'DaySpa' },
  { label: 'Hair Salon', value: 'HairSalon' },
  { label: 'Restaurant', value: 'Restaurant' },
  { label: 'Cafe / Coffee Shop', value: 'CafeOrCoffeeShop' },
  { label: 'Bakery', value: 'Bakery' },
  { label: 'Hotel', value: 'Hotel' },
  { label: 'Lodging Business', value: 'LodgingBusiness' },
  { label: 'Resort', value: 'Resort' },
  { label: 'Travel Agency', value: 'TravelAgency' },
  { label: 'Tourist Attraction', value: 'TouristAttraction' },
  { label: 'Store (generic)', value: 'Store' },
  { label: 'Shopping Center', value: 'ShoppingCenter' },
  { label: 'Clothing Store', value: 'ClothingStore' },
  { label: 'Grocery Store', value: 'GroceryStore' },
  { label: 'Gym / Sports', value: 'SportsActivityLocation' },
  { label: 'Auto Rental', value: 'AutoRental' },
  { label: 'Real Estate Agent', value: 'RealEstateAgent' },
  { label: 'School', value: 'School' },
  { label: 'Medical Business', value: 'MedicalBusiness' },
  { label: 'Dentist', value: 'Dentist' },
  { label: 'Pharmacy', value: 'Pharmacy' },
  { label: 'Professional Service', value: 'ProfessionalService' },
  { label: 'Plumber', value: 'Plumber' },
  { label: 'Electrician', value: 'Electrician' },
  { label: 'Event Venue', value: 'EventVenue' },
  { label: 'Night Club', value: 'NightClub' },
  { label: 'Museum', value: 'Museum' },
]

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

function parseHoursJson(raw: string | null | undefined): OpeningHourRow[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    if (!Array.isArray(v)) return []
    return v.map(r => ({
      dayOfWeek: Array.isArray(r?.dayOfWeek) ? r.dayOfWeek : (typeof r?.dayOfWeek === 'string' ? [r.dayOfWeek] : []),
      opens: typeof r?.opens === 'string' ? r.opens : '09:00',
      closes: typeof r?.closes === 'string' ? r.closes : '18:00',
    }))
  } catch { return [] }
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [skipExisting, setSkipExisting] = useState(true)
  const [includeDrafts, setIncludeDrafts] = useState(false)
  const [importResult, setImportResult] = useState<ListingImportResult | null>(null)
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkCategoryId, setBulkCategoryId] = useState('')
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkWorking, setBulkWorking] = useState(false)
  const [duplicatesOpen, setDuplicatesOpen] = useState(false)
  const [duplicatesLoading, setDuplicatesLoading] = useState(false)
  const [duplicatesError, setDuplicatesError] = useState('')
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [duplicateListingCount, setDuplicateListingCount] = useState(0)
  const [duplicateSelectedIds, setDuplicateSelectedIds] = useState<Set<string>>(new Set())
  const [duplicateDeleteOpen, setDuplicateDeleteOpen] = useState(false)
  const [duplicateDeleting, setDuplicateDeleting] = useState(false)

  const fetchListings = useCallback(async () => {
    const params = new URLSearchParams()
    if (appliedSearch) params.set('search', appliedSearch)
    if (categoryFilter !== 'all') params.set('category', categoryFilter)
    params.set('page', String(page))
    params.set('limit', String(PAGE_SIZE))
    const res = await fetch(`/api/admin/listings?${params}`)
    if (!res.ok) return
    const data: ListingsResponse = await res.json()
    setListings(data.items)
    setTotal(data.total)
    setTotalPages(data.totalPages)
    setPage(data.page)
  }, [appliedSearch, categoryFilter, page])

  const fetchCategories = async () => {
    const res = await fetch('/api/admin/categories')
    if (res.ok) setCategories(await res.json())
  }

  useEffect(() => { fetchCategories() }, [])

  useEffect(() => {
    setLoading(true)
    fetchListings().finally(() => setLoading(false))
  }, [fetchListings])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedSearch(searchInput.trim())
      setPage(1)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => { setSelectedIds(new Set()) }, [appliedSearch, categoryFilter])

  function applySearchNow() {
    setAppliedSearch(searchInput.trim())
    setPage(1)
  }

  function handleCategoryChange(value: string) {
    setCategoryFilter(value)
    setPage(1)
  }

  const allVisibleSelected = listings.length > 0 && listings.every((listing) => selectedIds.has(listing.id))
  const someVisibleSelected = listings.some((listing) => selectedIds.has(listing.id))

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleSelectAll(checked: boolean) {
    if (checked) setSelectedIds(new Set(listings.map((listing) => listing.id)))
    else setSelectedIds(new Set())
  }

  async function runBulkAction(action: 'delete' | 'changeCategory' | 'unpublish' | 'publish' | 'feature' | 'unfeature') {
    const ids = [...selectedIds]
    if (ids.length === 0) return

    if (action === 'changeCategory' && !bulkCategoryId) return

    setBulkWorking(true)
    try {
      const res = await fetch('/api/admin/listings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids,
          action,
          ...(action === 'changeCategory' ? { categoryId: bulkCategoryId } : {}),
        }),
      })
      if (!res.ok) throw new Error('Bulk action failed')
      setSelectedIds(new Set())
      setBulkDeleteOpen(false)
      await fetchListings()
    } catch {
      // keep selection so admin can retry
    } finally {
      setBulkWorking(false)
    }
  }

  const handleEdit = (listing: Listing) => {
    setSelectedListing(listing)
    // Support older API responses that don't yet include the `images` array
    const imgs = Array.isArray(listing.images) && listing.images.length > 0
      ? listing.images
      : (listing.image ? [listing.image] : [])
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
      published: listing.published ?? true,
      city: listing.city || 'Agadir',
      region: listing.region || '',
      postalCode: listing.postalCode || '',
      country: listing.country || 'MA',
      latitude: listing.latitude != null ? String(listing.latitude) : '',
      longitude: listing.longitude != null ? String(listing.longitude) : '',
      priceRange: listing.priceRange || '',
      openingHours: parseHoursJson(listing.openingHours),
      seoTitle: listing.seoTitle || '',
      metaDescription: listing.metaDescription || '',
      metaKeywords: listing.metaKeywords || '',
      canonicalUrl: listing.canonicalUrl || '',
      schemaType: listing.schemaType || '',
      logo: listing.logo || '',
    })
    setIsNew(false)
    setEditDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedListing(null)
    setForm(emptyForm)
    setIsNew(true)
    setEditDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        ...form,
        phone: form.phone || null,
        website: form.website || null,
        email: form.email || null,
        images: form.images,
        // SEO + location: send empty strings to clear, parsed numbers for geo
        region: form.region || null,
        postalCode: form.postalCode || null,
        latitude: form.latitude !== '' ? Number(form.latitude) : null,
        longitude: form.longitude !== '' ? Number(form.longitude) : null,
        priceRange: form.priceRange || null,
        // openingHours: persist as array; empty -> null
        openingHours: form.openingHours.length > 0 ? form.openingHours : null,
        seoTitle: form.seoTitle || null,
        metaDescription: form.metaDescription || null,
        metaKeywords: form.metaKeywords || null,
        canonicalUrl: form.canonicalUrl || null,
        // Empty string means "use category default"
        schemaType: form.schemaType || null,
        logo: form.logo || null,
      }

      if (isNew) {
        const res = await fetch('/api/admin/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
      } else if (selectedListing) {
        const res = await fetch(`/api/admin/listings/${selectedListing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
      }
      setEditDialogOpen(false)
      fetchListings()
    } catch {
      // handle error
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedListing) return
    try {
      await fetch(`/api/admin/listings/${selectedListing.id}`, { method: 'DELETE' })
      setDeleteDialogOpen(false)
      setSelectedListing(null)
      fetchListings()
    } catch {
      // handle error
    }
  }

  const handleToggleFeatured = async (listing: Listing) => {
    try {
      await fetch(`/api/admin/listings/${listing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !listing.featured }),
      })
      fetchListings()
    } catch {
      // handle error
    }
  }

  async function handleFindDuplicates() {
    setDuplicatesOpen(true)
    setDuplicatesLoading(true)
    setDuplicatesError('')
    setDuplicateGroups([])
    setDuplicateListingCount(0)
    setDuplicateSelectedIds(new Set())

    try {
      const res = await fetch('/api/admin/listings/duplicates')
      const data: DuplicatesResponse & { error?: string } = await res.json()
      if (!res.ok) {
        setDuplicatesError(data.error || 'Failed to scan for duplicates.')
        return
      }
      setDuplicateGroups(data.groups)
      setDuplicateListingCount(data.duplicateListingCount)
    } catch {
      setDuplicatesError('Failed to scan for duplicates.')
    } finally {
      setDuplicatesLoading(false)
    }
  }

  async function handleEditById(id: string) {
    try {
      const res = await fetch(`/api/admin/listings/${id}`)
      if (!res.ok) return
      const listing: Listing = await res.json()
      setDuplicatesOpen(false)
      handleEdit(listing)
    } catch {
      // ignore
    }
  }

  function toggleDuplicateSelected(id: string, checked: boolean) {
    setDuplicateSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleDuplicateGroup(group: DuplicateGroup, checked: boolean) {
    setDuplicateSelectedIds((prev) => {
      const next = new Set(prev)
      for (const listing of group.listings) {
        if (checked) next.add(listing.id)
        else next.delete(listing.id)
      }
      return next
    })
  }

  function selectAllDuplicates() {
    const ids = new Set<string>()
    for (const group of duplicateGroups) {
      for (const listing of group.listings) ids.add(listing.id)
    }
    setDuplicateSelectedIds(ids)
  }

  async function handleDeleteDuplicateSelection() {
    const ids = [...duplicateSelectedIds]
    if (ids.length === 0) return

    setDuplicateDeleting(true)
    try {
      const res = await fetch('/api/admin/listings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'delete' }),
      })
      if (!res.ok) throw new Error('Delete failed')

      setDuplicateDeleteOpen(false)
      setDuplicateSelectedIds(new Set())
      await fetchListings()

      const scanRes = await fetch('/api/admin/listings/duplicates')
      const data: DuplicatesResponse & { error?: string } = await scanRes.json()
      if (scanRes.ok) {
        setDuplicateGroups(data.groups)
        setDuplicateListingCount(data.duplicateListingCount)
      }
    } catch {
      // keep selection so admin can retry
    } finally {
      setDuplicateDeleting(false)
    }
  }

  async function handleImport() {
    if (!importFile) {
      setImportError('Choose a WordPress listings XML export file first.')
      return
    }

    setImporting(true)
    setImportError('')
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('skipExisting', String(skipExisting))
      formData.append('includeDrafts', String(includeDrafts))

      const res = await fetch('/api/admin/listings/import', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setImportError(data.error || 'Import failed.')
        return
      }

      setImportResult(data)
      setImportFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await Promise.all([fetchListings(), fetchCategories()])
    } catch {
      setImportError('Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all business listings in the directory</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleFindDuplicates}>
            <Files className="h-4 w-4 mr-1.5" />
            Find duplicates
          </Button>
          <Button onClick={handleNew} className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white">
            <Plus className="h-4 w-4 mr-1.5" /> Add Listing
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5" />
            Import from WordPress
          </CardTitle>
          <CardDescription>
            Upload a WordPress WXR export with job listings. Businesses, categories, cover images, galleries, and logos are imported locally.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="wp-listings-xml">WordPress listings export</Label>
              <Input
                id="wp-listings-xml"
                ref={fileInputRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                onChange={(e) => {
                  setImportFile(e.target.files?.[0] ?? null)
                  setImportError('')
                }}
              />
            </div>
            <Button onClick={handleImport} disabled={importing || !importFile}>
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import listings
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={skipExisting} onCheckedChange={(v) => setSkipExisting(v === true)} />
              Skip listings that already exist (by slug)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={includeDrafts} onCheckedChange={(v) => setIncludeDrafts(v === true)} />
              Include draft listings
            </label>
          </div>

          {importError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{importError}</p>
          )}

          {importResult && (
            <div className="text-sm bg-green-50 border border-green-100 rounded-lg px-4 py-3 space-y-2">
              <p className="font-medium text-green-800">{importResult.message || 'Import completed.'}</p>
              <ul className="text-green-900 grid sm:grid-cols-2 gap-1">
                <li>Listings imported: {importResult.listingsImported}</li>
                <li>Listings skipped: {importResult.listingsSkipped}</li>
                <li>Listings failed: {importResult.listingsFailed}</li>
                <li>Categories created: {importResult.categoriesCreated}</li>
                <li>Media downloaded: {importResult.mediaDownloaded}</li>
                <li>Media failed: {importResult.mediaFailed}</li>
              </ul>
              {importResult.errors?.length > 0 && (
                <div className="pt-2 border-t border-green-200">
                  <p className="font-medium text-amber-800 mb-1">Warnings</p>
                  <ul className="text-amber-900 space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <form
              className="relative flex-1 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                applySearchNow()
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, address, phone, email…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="outline">Search</Button>
            </form>
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!loading && (
            <p className="text-xs text-muted-foreground mt-3">
              {total === 0
                ? 'No listings match your filters'
                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} listings`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {selectedIds.size > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b bg-muted/30">
              <p className="text-sm font-medium">{selectedIds.size} selected</p>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                  <SelectTrigger className="w-full sm:w-52 h-9">
                    <SelectValue placeholder="Move to category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkWorking || !bulkCategoryId}
                  onClick={() => runBulkAction('changeCategory')}
                >
                  Change category
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkWorking}
                  onClick={() => runBulkAction('unpublish')}
                >
                  Unpublish
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkWorking}
                  onClick={() => runBulkAction('publish')}
                >
                  Publish
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkWorking}
                  onClick={() => runBulkAction('feature')}
                >
                  <Star className="h-3.5 w-3.5 mr-1 text-amber-500" />
                  Set featured
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkWorking}
                  onClick={() => runBulkAction('unfeature')}
                >
                  Remove featured
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={bulkWorking}
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No listings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 pl-4">
                      <Checkbox
                        checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                        onCheckedChange={(value) => toggleSelectAll(value === true)}
                        aria-label="Select all listings"
                      />
                    </TableHead>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-center">Reviews</TableHead>
                    <TableHead className="text-center">Featured</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => {
                    const featuredImage = listing.images?.[0] || listing.image
                    return (
                    <TableRow key={listing.id} data-state={selectedIds.has(listing.id) ? 'selected' : undefined}>
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={selectedIds.has(listing.id)}
                          onCheckedChange={(value) => toggleSelected(listing.id, value === true)}
                          aria-label={`Select ${listing.name}`}
                        />
                      </TableCell>
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
                            <Building2 className="h-4 w-4" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{listing.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-48">{listing.address}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{listing.category.name}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={listing.published ? 'default' : 'secondary'} className="text-xs">
                          {listing.published ? 'Published' : 'Unpublished'}
                        </Badge>
                      </TableCell>
                      <TableCell><StarRating rating={listing.rating} /></TableCell>
                      <TableCell className="text-center text-sm">{listing.reviewCount}</TableCell>
                      <TableCell className="text-center">
                        <button onClick={() => handleToggleFeatured(listing)} className="inline-flex">
                          {listing.featured ? <ToggleRight className="h-6 w-6 text-orange-500" /> : <ToggleLeft className="h-6 w-6 text-gray-300" />}
                        </button>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(listing)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => { setSelectedListing(listing); setDeleteDialogOpen(true) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
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

      <Dialog open={duplicatesOpen} onOpenChange={setDuplicatesOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Duplicate listings</DialogTitle>
            <DialogDescription>
              Listings with the same normalized name or the same phone number (digits only).
            </DialogDescription>
          </DialogHeader>

          {duplicatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : duplicatesError ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{duplicatesError}</p>
          ) : duplicateGroups.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Files className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No duplicate listings found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {duplicateGroups.length} duplicate group{duplicateGroups.length === 1 ? '' : 's'} affecting {duplicateListingCount} listing{duplicateListingCount === 1 ? '' : 's'}.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllDuplicates}>
                    Select all
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDuplicateSelectedIds(new Set())}
                    disabled={duplicateSelectedIds.size === 0}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={duplicateSelectedIds.size === 0}
                    onClick={() => setDuplicateDeleteOpen(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete selected ({duplicateSelectedIds.size})
                  </Button>
                </div>
              </div>
              {duplicateGroups.map((group) => {
                const groupIds = group.listings.map((l) => l.id)
                const allGroupSelected = groupIds.every((id) => duplicateSelectedIds.has(id))
                const someGroupSelected = groupIds.some((id) => duplicateSelectedIds.has(id))

                return (
                <div key={`${group.type}-${group.key}`} className="rounded-lg border bg-muted/20 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b bg-background">
                    <Checkbox
                      checked={allGroupSelected ? true : someGroupSelected ? 'indeterminate' : false}
                      onCheckedChange={(v) => toggleDuplicateGroup(group, v === true)}
                      aria-label={`Select all in ${group.displayKey}`}
                    />
                    <Badge variant={group.type === 'name' ? 'default' : 'secondary'}>
                      {group.type === 'name' ? 'Same name' : 'Same phone'}
                    </Badge>
                    <span className="text-sm font-medium truncate">{group.displayKey}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{group.listings.length} listings</span>
                  </div>
                  <div className="divide-y">
                    {group.listings.map((listing) => (
                      <div key={listing.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3">
                        <Checkbox
                          checked={duplicateSelectedIds.has(listing.id)}
                          onCheckedChange={(v) => toggleDuplicateSelected(listing.id, v === true)}
                          aria-label={`Select ${listing.name}`}
                          className="sm:mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{listing.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{listing.address}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{listing.category.name}</Badge>
                            {listing.phone && <span className="text-xs text-muted-foreground">{listing.phone}</span>}
                            <Badge variant={listing.published ? 'default' : 'outline'} className="text-xs">
                              {listing.published ? 'Published' : 'Unpublished'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 sm:ml-auto">
                          <Button variant="outline" size="sm" onClick={() => handleEditById(listing.id)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/listing/${listing.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              View
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )})}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={duplicateDeleteOpen} onOpenChange={setDuplicateDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected duplicates</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {duplicateSelectedIds.size} listing{duplicateSelectedIds.size === 1 ? '' : 's'}? This also removes associated reviews and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={duplicateDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={duplicateDeleting}
              onClick={handleDeleteDuplicateSelection}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {duplicateDeleting ? 'Deleting…' : 'Delete selected'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit / New Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? 'Add New Listing' : 'Edit Listing'}</DialogTitle>
            <DialogDescription>{isNew ? 'Create a new business listing in the directory.' : 'Update the listing details below.'}</DialogDescription>
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
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Address *</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Images</Label>
              <MultiImageInput
                value={form.images}
                onChange={(next) => setForm({ ...form, images: next })}
              />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
                <Label>Featured Listing</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
                <Label>Published</Label>
              </div>
            </div>

            {/* ─── Location ─── */}
            <Collapsible icon={<MapPin className="h-4 w-4" />} title="Location & geo">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="City"><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></Field>
                <Field label="Region / State"><Input value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} /></Field>
                <Field label="Postal code"><Input value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} /></Field>
                <Field label="Country (ISO-2)"><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></Field>
                <Field label="Latitude" hint="e.g. 30.4278">
                  <Input value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="30.4278" />
                </Field>
                <Field label="Longitude" hint="e.g. -9.5981">
                  <Input value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="-9.5981" />
                </Field>
              </div>
            </Collapsible>

            {/* ─── Schema & hours ─── */}
            <Collapsible icon={<Clock className="h-4 w-4" />} title="Schema & hours">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Schema.org type" hint="Override category default. Blank = inherit.">
                  <Select value={form.schemaType || '__none__'} onValueChange={v => setForm({ ...form, schemaType: v === '__none__' ? '' : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">(use category default)</SelectItem>
                      {SCHEMA_TYPES.filter(t => t.value).map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Price range" hint="$, $$, $$$">
                  <Input value={form.priceRange} onChange={e => setForm({ ...form, priceRange: e.target.value })} placeholder="$$" />
                </Field>
                <Field label="Logo URL (optional)">
                  <Input value={form.logo} onChange={e => setForm({ ...form, logo: e.target.value })} />
                </Field>
              </div>
              <OpeningHoursEditor value={form.openingHours} onChange={hours => setForm({ ...form, openingHours: hours })} />
            </Collapsible>

            {/* ─── SEO overrides ─── */}
            <Collapsible icon={<SearchIcon className="h-4 w-4" />} title="SEO overrides">
              <Field label="SEO title" hint="Leave empty to auto-generate from name + category.">
                <Input value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })} />
              </Field>
              <Field label="Meta description" hint="≤ 160 characters recommended.">
                <Textarea value={form.metaDescription} onChange={e => setForm({ ...form, metaDescription: e.target.value })} rows={2} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Meta keywords (comma-separated)">
                  <Input value={form.metaKeywords} onChange={e => setForm({ ...form, metaKeywords: e.target.value })} />
                </Field>
                <Field label="Canonical URL override" hint="Leave empty to use the generated canonical.">
                  <Input value={form.canonicalUrl} onChange={e => setForm({ ...form, canonicalUrl: e.target.value })} />
                </Field>
              </div>
            </Collapsible>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.name || !form.categoryId || !form.description || !form.address} className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white">
                {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {isNew ? 'Create Listing' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected listings</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {selectedIds.size} listing{selectedIds.size === 1 ? '' : 's'}? This also removes associated reviews and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkWorking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkWorking}
              onClick={() => runBulkAction('delete')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {bulkWorking ? 'Deleting…' : 'Delete selected'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedListing?.name}&quot;? This will also delete all associated reviews and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Reusable small components scoped to this page ─────────

function Collapsible({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-muted/40 hover:bg-muted/60 transition text-sm font-medium"
      >
        <span className="flex items-center gap-2 text-gray-800">{icon}{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
      </button>
      {open && <div className="p-3 space-y-3 bg-white">{children}</div>}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-gray-700">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function OpeningHoursEditor({ value, onChange }: { value: OpeningHourRow[]; onChange: (v: OpeningHourRow[]) => void }) {
  const add = () => onChange([...value, { dayOfWeek: ['Monday'], opens: '09:00', closes: '18:00' }])
  const remove = (i: number) => onChange(value.filter((_, k) => k !== i))
  const update = (i: number, patch: Partial<OpeningHourRow>) =>
    onChange(value.map((row, k) => k === i ? { ...row, ...patch } : row))
  const toggleDay = (i: number, day: string) => {
    const cur = value[i].dayOfWeek
    update(i, { dayOfWeek: cur.includes(day) ? cur.filter(d => d !== day) : [...cur, day] })
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-gray-700">Opening hours</Label>
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add block
        </Button>
      </div>
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">No opening hours configured.</p>
      )}
      {value.map((row, i) => (
        <div key={i} className="border rounded-md p-2 space-y-2 bg-muted/20">
          <div className="flex flex-wrap gap-1">
            {DAYS_OF_WEEK.map(d => {
              const on = row.dayOfWeek.includes(d)
              return (
                <button
                  type="button"
                  key={d}
                  onClick={() => toggleDay(i, d)}
                  className={`text-[11px] px-2 py-1 rounded border transition ${on
                    ? 'bg-orange-100 border-orange-300 text-orange-800'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                  {d.slice(0, 3)}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <Input type="time" value={row.opens} onChange={e => update(i, { opens: e.target.value })} className="w-32" />
            <span className="text-muted-foreground text-xs">to</span>
            <Input type="time" value={row.closes} onChange={e => update(i, { closes: e.target.value })} className="w-32" />
            <Button type="button" size="icon" variant="ghost" onClick={() => remove(i)}>
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
