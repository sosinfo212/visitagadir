'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Star, Search, Trash2, Eye, Loader2, CheckCircle2, XCircle, Clock, Filter,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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

interface Review {
  id: string
  authorName: string
  rating: number
  comment: string
  approved: boolean
  listingId: string
  listing: { name: string }
  createdAt: string
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3 w-3 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function ratingColor(rating: number) {
  if (rating >= 4) return 'bg-green-100 text-green-700 border-green-200'
  if (rating >= 3) return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-red-100 text-red-700 border-red-200'
}

function statusBadge(approved: boolean) {
  if (approved) {
    return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Approved</Badge>
  }
  return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingFilter, setRatingFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    try {
      // Use admin-specific endpoint that returns ALL reviews (including pending)
      const res = await fetch('/api/admin/reviews')
      if (res.ok) {
        const data = await res.json()
        setReviews(data)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchReviews().finally(() => setLoading(false))
  }, [fetchReviews])

  const handleApprove = async (reviewId: string) => {
    setActionLoading(reviewId)
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })
      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, approved: true } : r))
      }
    } catch { /* ignore */ }
    setActionLoading(null)
  }

  const handleReject = async (reviewId: string) => {
    setActionLoading(reviewId)
    try {
      // Reject = set approved to false (keep the review but don't publish)
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false }),
      })
      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, approved: false } : r))
      }
    } catch { /* ignore */ }
    setActionLoading(null)
  }

  const handleDelete = async () => {
    if (!selectedReview) return
    try {
      await fetch(`/api/admin/reviews/${selectedReview.id}`, { method: 'DELETE' })
      setDeleteDialogOpen(false)
      setReviews(prev => prev.filter(r => r.id !== selectedReview.id))
      setSelectedReview(null)
    } catch { /* ignore */ }
  }

  const filtered = reviews.filter((r) => {
    if (statusFilter === 'pending' && r.approved) return false
    if (statusFilter === 'approved' && !r.approved) return false
    if (ratingFilter !== 'all' && r.rating !== parseInt(ratingFilter)) return false
    if (search && !r.authorName.toLowerCase().includes(search.toLowerCase()) && !r.comment.toLowerCase().includes(search.toLowerCase()) && !r.listing.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const pendingCount = reviews.filter(r => !r.approved).length
  const approvedCount = reviews.filter(r => r.approved).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="h-6 w-6 text-orange-500" />
            Reviews
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Moderate and approve user reviews before publishing</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-sm px-3 py-1">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            {pendingCount} pending review{pendingCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-50"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-50"><Star className="h-5 w-5 text-gray-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{reviews.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by author, content, or listing..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Ratings" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                {[5, 4, 3, 2, 1].map((r) => (
                  <SelectItem key={r} value={r.toString()}>{r} Star{r !== 1 ? 's' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No reviews found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Status</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Listing</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((review) => (
                    <TableRow key={review.id} className={!review.approved ? 'bg-amber-50/50' : ''}>
                      <TableCell className="pl-4">
                        {statusBadge(review.approved)}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{review.authorName}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ratingColor(review.rating)}>
                          {review.rating}/5
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-48">
                        <p className="text-sm text-muted-foreground truncate">{review.comment}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-orange-600 font-medium">{review.listing.name}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          {!review.approved && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleApprove(review.id)}
                              disabled={actionLoading === review.id}
                              title="Approve"
                            >
                              {actionLoading === review.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            </Button>
                          )}
                          {review.approved && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => handleReject(review.id)}
                              disabled={actionLoading === review.id}
                              title="Unapprove (hide from public)"
                            >
                              {actionLoading === review.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedReview(review); setViewDialogOpen(true) }}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => { setSelectedReview(review); setDeleteDialogOpen(true) }}><Trash2 className="h-3.5 w-3.5" /></Button>
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

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>Full review information and moderation.</DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedReview.authorName}</p>
                  <StarRating rating={selectedReview.rating} />
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(selectedReview.approved)}
                  <Badge variant="outline" className={ratingColor(selectedReview.rating)}>
                    {selectedReview.rating}/5
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Listing</p>
                <p className="text-sm text-orange-600 font-medium">{selectedReview.listing.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Comment</p>
                <p className="text-sm bg-gray-50 p-3 rounded-xl">{selectedReview.comment}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Date</p>
                <p className="text-sm">{formatDate(selectedReview.createdAt)}</p>
              </div>
              <div className="flex gap-2 pt-2">
                {!selectedReview.approved && (
                  <Button
                    onClick={() => { handleApprove(selectedReview.id); setViewDialogOpen(false) }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Approve & Publish
                  </Button>
                )}
                {selectedReview.approved && (
                  <Button
                    variant="outline"
                    onClick={() => { handleReject(selectedReview.id); setViewDialogOpen(false) }}
                    className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Unapprove
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => { setViewDialogOpen(false); setDeleteDialogOpen(true) }}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this review by &quot;{selectedReview?.authorName}&quot;? The listing&apos;s average rating will be recalculated automatically.
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
