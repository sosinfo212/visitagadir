'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import {
  Building2, Star, Pencil, Trash2, MessageSquare, Loader2,
  ArrowLeft, ExternalLink, LogOut, Save, X, Clock, CheckCircle2, XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { MultiImageInput } from '@/components/multi-image-input'

interface Review {
  id: string
  authorName: string
  rating: number
  comment: string
  approved: boolean
  ownerReply: string | null
  ownerRepliedAt: string | null
  createdAt: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface MyBusiness {
  id: string
  submissionId: string | null
  listingId: string | null
  status: 'pending' | 'approved' | 'rejected' | string
  name: string
  slug: string | null
  description: string
  address: string
  phone: string | null
  website: string | null
  email: string | null
  images: string[]
  categorySlug: string
  category: { name: string; slug: string }
  rating: number
  reviewCount: number
  reviews: Review[]
}

interface EditForm {
  name: string
  description: string
  address: string
  phone: string
  website: string
  email: string
  categorySlug: string
  images: string[]
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') {
    return (
      <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Approved
      </Badge>
    )
  }
  if (status === 'rejected') {
    return (
      <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50 gap-1">
        <XCircle className="h-3 w-3" />
        Rejected
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 gap-1">
      <Clock className="h-3 w-3" />
      Pending review
    </Badge>
  )
}

export default function MyListingsClient({
  userName,
  userEmail,
}: {
  userName?: string | null
  userEmail?: string | null
}) {
  const [items, setItems] = useState<MyBusiness[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MyBusiness | null>(null)
  const [selected, setSelected] = useState<MyBusiness | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [replySaving, setReplySaving] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setError('')
    try {
      const [listRes, catRes] = await Promise.all([
        fetch('/api/my-listings'),
        fetch('/api/categories'),
      ])
      if (!listRes.ok) {
        const data = await listRes.json()
        throw new Error(data.error || 'Failed to load listings')
      }
      setItems(await listRes.json())
      if (catRes.ok) setCategories(await catRes.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  function openEdit(item: MyBusiness) {
    setSelected(item)
    setEditForm({
      name: item.name,
      description: item.description,
      address: item.address,
      phone: item.phone || '',
      website: item.website || '',
      email: item.email || '',
      categorySlug: item.categorySlug || item.category.slug,
      images: item.images || [],
    })
    setEditOpen(true)
  }

  function updateEndpoint(item: MyBusiness) {
    if (item.submissionId) return `/api/my-submissions/${item.submissionId}`
    if (item.listingId) return `/api/my-listings/${item.listingId}`
    return null
  }

  async function handleSave() {
    if (!selected || !editForm) return
    const endpoint = updateEndpoint(selected)
    if (!endpoint) return

    setSaving(true)
    setError('')
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          businessName: editForm.name,
          description: editForm.description,
          address: editForm.address,
          category: editForm.categorySlug,
          categorySlug: editForm.categorySlug,
          phone: editForm.phone || null,
          website: editForm.website || null,
          email: editForm.email || null,
          images: editForm.images,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      setEditOpen(false)
      await fetchItems()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item: MyBusiness) {
    setError('')
    try {
      let endpoint: string | null = null
      if (item.submissionId) endpoint = `/api/my-submissions/${item.submissionId}`
      else if (item.listingId) endpoint = `/api/my-listings/${item.listingId}`

      if (!endpoint) return

      const res = await fetch(endpoint, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      setDeleteTarget(null)
      await fetchItems()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  async function handleReply(listingId: string, reviewId: string) {
    const reply = replyDrafts[reviewId]?.trim()
    if (!reply) return
    setReplySaving(reviewId)
    setError('')
    try {
      const res = await fetch(`/api/my-listings/${listingId}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save reply')
      setReplyDrafts((prev) => ({ ...prev, [reviewId]: '' }))
      await fetchItems()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save reply')
    } finally {
      setReplySaving(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track submission status, edit your businesses, and reply to reviews.
            </p>
            <p className="text-xs text-muted-foreground mt-1 md:hidden">{userName || userEmail}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground hidden md:inline">{userName || userEmail}</span>
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign out
            </Button>
            <Link href="/?listBusiness=1">
              <Button className="bg-gradient-to-r from-orange-500 to-teal-500" size="sm">
                + Add listing
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold">No listings yet</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Submit your business from the homepage. It will appear here immediately with a pending status.
              </p>
              <Link href="/?listBusiness=1">
                <Button className="mt-6 bg-gradient-to-r from-orange-500 to-teal-500">
                  List your business
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.submissionId || item.listingId || item.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">{item.name}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <StatusBadge status={item.status} />
                      <Badge variant="outline">{item.category.name}</Badge>
                      {item.status === 'approved' && item.listingId && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Stars rating={Math.round(item.rating)} />
                          <span>{item.rating.toFixed(1)} ({item.reviewCount} reviews)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'approved' && item.slug && (
                      <Link href={`/listing/${item.slug}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1.5" />
                          View
                        </Button>
                      </Link>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {item.status === 'pending' && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    {item.listingId
                      ? 'Your changes are awaiting admin approval. The public listing still shows the current published version.'
                      : 'Your listing is awaiting admin approval. You can still edit or remove it.'}
                  </p>
                )}
                {item.status === 'rejected' && (
                  <p className="text-sm text-red-800 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    Your listing was not approved. Edit and save to resubmit for review.
                  </p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                <p className="text-sm text-muted-foreground">{item.address}</p>

                {item.status === 'approved' && item.listingId && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <MessageSquare className="h-4 w-4" />
                      Reviews ({item.reviews.length})
                    </h3>
                    {!item.reviews.length ? (
                      <p className="text-sm text-muted-foreground">No reviews yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {item.reviews.map((review) => (
                          <div key={review.id} className="rounded-xl border bg-white p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm">{review.authorName}</p>
                                <Stars rating={review.rating} />
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={
                                    review.approved
                                      ? 'text-green-700 border-green-200 bg-green-50'
                                      : 'text-amber-700 border-amber-200 bg-amber-50'
                                  }
                                >
                                  {review.approved ? 'Published' : 'Pending approval'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{review.comment}</p>

                            {review.ownerReply ? (
                              <div className="rounded-lg bg-orange-50 border border-orange-100 p-3">
                                <p className="text-xs font-semibold text-orange-800 mb-1">Your reply</p>
                                <p className="text-sm text-orange-900">{review.ownerReply}</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Write a public reply to this review..."
                                  value={replyDrafts[review.id] || ''}
                                  onChange={(e) =>
                                    setReplyDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))
                                  }
                                  rows={2}
                                  className="text-sm"
                                />
                                <Button
                                  size="sm"
                                  disabled={!replyDrafts[review.id]?.trim() || replySaving === review.id}
                                  onClick={() => handleReply(item.listingId!, review.id)}
                                >
                                  {replySaving === review.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Post reply'
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </main>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit listing</DialogTitle>
            <DialogDescription>
              {selected?.status === 'approved'
                ? 'Your changes will be submitted for admin review. The public listing keeps showing the current version until approved.'
                : selected?.status === 'rejected'
                  ? 'Saving will resubmit your listing for admin review.'
                  : 'Update your submission while it is pending review.'}
            </DialogDescription>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Business name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editForm.categorySlug}
                  onValueChange={(v) => setEditForm({ ...editForm, categorySlug: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="https://"
                />
              </div>
              <div className="space-y-2">
                <Label>Images</Label>
                <MultiImageInput
                  value={editForm.images}
                  onChange={(images) => setEditForm({ ...editForm, images })}
                  maxImages={8}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  <X className="h-4 w-4 mr-1.5" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1.5" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.status === 'approved'
                ? 'This permanently removes your live listing and all its reviews.'
                : 'This removes your submission from the queue.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
