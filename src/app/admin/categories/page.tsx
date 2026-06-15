'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  FolderOpen, Plus, Pencil, Trash2, Loader2, AlertTriangle,
  ChevronDown, ChevronRight, Search as SearchIcon, ImageIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  description: string | null
  image?: string | null
  defaultSchemaType?: string | null
  seoTitle?: string | null
  metaDescription?: string | null
  metaKeywords?: string | null
  canonicalUrl?: string | null
  _count: { listings: number }
}

interface CategoryForm {
  name: string
  slug: string
  icon: string
  description: string
  image: string
  defaultSchemaType: string
  seoTitle: string
  metaDescription: string
  metaKeywords: string
  canonicalUrl: string
}

const emptyForm: CategoryForm = {
  name: '', slug: '', icon: '', description: '',
  image: '', defaultSchemaType: '',
  seoTitle: '', metaDescription: '', metaKeywords: '', canonicalUrl: '',
}

// Mirror of the SCHEMA_TYPE_CATALOG; admin can pick a category default so that
// every listing inside inherits it unless they override per-listing.
const SCHEMA_TYPES: Array<{ label: string; value: string }> = [
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [isNew, setIsNew] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories')
      if (res.ok) setCategories(await res.json())
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchCategories().finally(() => setLoading(false))
  }, [fetchCategories])

  const handleEdit = (cat: Category) => {
    setSelectedCategory(cat)
    setForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      description: cat.description || '',
      image: cat.image || '',
      defaultSchemaType: cat.defaultSchemaType || '',
      seoTitle: cat.seoTitle || '',
      metaDescription: cat.metaDescription || '',
      metaKeywords: cat.metaKeywords || '',
      canonicalUrl: cat.canonicalUrl || '',
    })
    setIsNew(false)
    setEditDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedCategory(null)
    setForm(emptyForm)
    setIsNew(true)
    setEditDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        icon: form.icon,
        description: form.description || null,
        image: form.image || null,
        defaultSchemaType: form.defaultSchemaType || null,
        seoTitle: form.seoTitle || null,
        metaDescription: form.metaDescription || null,
        metaKeywords: form.metaKeywords || null,
        canonicalUrl: form.canonicalUrl || null,
      }

      if (isNew) {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create category')
        }
      } else if (selectedCategory) {
        const res = await fetch(`/api/admin/categories/${selectedCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
      }
      setEditDialogOpen(false)
      fetchCategories()
    } catch { /* ignore */ }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!selectedCategory) return
    try {
      await fetch(`/api/admin/categories/${selectedCategory.id}`, { method: 'DELETE' })
      setDeleteDialogOpen(false)
      setSelectedCategory(null)
      fetchCategories()
    } catch { /* ignore */ }
  }

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setForm({
      ...form,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage business categories in the directory</p>
        </div>
        <Button onClick={handleNew} className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white">
          <Plus className="h-4 w-4 mr-1.5" /> Add Category
        </Button>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : categories.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No categories found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead className="text-center">Listings</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="pl-4">
                        <div>
                          <p className="font-medium text-sm">{cat.name}</p>
                          {cat.description && <p className="text-xs text-muted-foreground truncate max-w-64">{cat.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell><code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{cat.slug}</code></TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{cat.icon}</Badge></TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">{cat._count.listings}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(cat)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => { setSelectedCategory(cat); setDeleteDialogOpen(true) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit / New Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? 'Add New Category' : 'Edit Category'}</DialogTitle>
            <DialogDescription>{isNew ? 'Create a new business category.' : 'Update the category details.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Restaurants & Cafés" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" />
              </div>
              <div className="space-y-2">
                <Label>Icon Name *</Label>
                <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="e.g. UtensilsCrossed" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">Icon must be a Lucide name (e.g. Hotel, Waves, ShoppingBag).</p>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Used in the category meta description fallback and CollectionPage schema." rows={3} />
            </div>

            <CatCollapsible icon={<ImageIcon className="h-4 w-4" />} title="Image & schema defaults">
              <div className="space-y-2">
                <Label className="text-xs">Image URL or data URL</Label>
                <Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://… or data:image/…" />
                {form.image && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={form.image} alt="" className="h-20 w-20 object-cover rounded-md border" />
                )}
                <p className="text-[11px] text-muted-foreground">Used as the OG/Twitter image for the category page and `image` field in CollectionPage schema.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Default schema type for listings</Label>
                <Select
                  value={form.defaultSchemaType || '__none__'}
                  onValueChange={v => setForm({ ...form, defaultSchemaType: v === '__none__' ? '' : v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">(LocalBusiness — generic)</SelectItem>
                    {SCHEMA_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Inherited by every listing in this category unless overridden.</p>
              </div>
            </CatCollapsible>

            <CatCollapsible icon={<SearchIcon className="h-4 w-4" />} title="SEO overrides">
              <div className="space-y-2">
                <Label className="text-xs">SEO title</Label>
                <Input value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })} placeholder="Leave empty to auto-generate." />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Meta description</Label>
                <Textarea value={form.metaDescription} onChange={e => setForm({ ...form, metaDescription: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Meta keywords</Label>
                  <Input value={form.metaKeywords} onChange={e => setForm({ ...form, metaKeywords: e.target.value })} placeholder="comma, separated" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Canonical URL override</Label>
                  <Input value={form.canonicalUrl} onChange={e => setForm({ ...form, canonicalUrl: e.target.value })} />
                </div>
              </div>
            </CatCollapsible>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.name || !form.icon} className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white">
                {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {isNew ? 'Create Category' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Category
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedCategory?.name}&quot;?
              This will also permanently delete all {selectedCategory?._count.listings || 0} listing(s) and their reviews in this category. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Category & All Listings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CatCollapsible({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
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
