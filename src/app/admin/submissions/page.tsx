'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  FileText, Search, CheckCircle2, XCircle, Eye, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface Submission {
  id: string
  businessName: string
  description: string
  category: string
  address: string
  phone: string | null
  website: string | null
  email: string | null
  ownerName: string
  message: string | null
  image: string | null
  images?: string[]
  status: string
  createdAt: string
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  }
  return (
    <Badge variant="outline" className={styles[status] || 'bg-gray-100 text-gray-700'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch('/api/submissions')
      if (res.ok) setSubmissions(await res.json())
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchSubmissions().finally(() => setLoading(false))
  }, [fetchSubmissions])

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        fetchSubmissions()
        if (selectedSubmission?.id === id) {
          setSelectedSubmission({ ...selectedSubmission, status })
        }
      }
    } catch { /* ignore */ }
    setProcessing(null)
  }

  const filtered = submissions.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (search && !s.businessName.toLowerCase().includes(search.toLowerCase()) && !s.ownerName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const pendingCount = submissions.filter(s => s.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and manage business submissions
            {pendingCount > 0 && <span className="text-amber-600 font-medium"> ({pendingCount} pending)</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by business or owner name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No submissions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Business Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="pl-4">
                        <p className="font-medium text-sm">{sub.businessName}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-48">{sub.address}</p>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{sub.category}</Badge></TableCell>
                      <TableCell className="text-sm">{sub.ownerName}</TableCell>
                      <TableCell>{statusBadge(sub.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(sub.createdAt)}</TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedSubmission(sub); setViewDialogOpen(true) }}><Eye className="h-3.5 w-3.5" /></Button>
                          {sub.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" disabled={processing === sub.id} onClick={() => handleStatusUpdate(sub.id, 'approved')}><CheckCircle2 className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" disabled={processing === sub.id} onClick={() => handleStatusUpdate(sub.id, 'rejected')}><XCircle className="h-4 w-4" /></Button>
                            </>
                          )}
                          {processing === sub.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
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

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Submission Details
              {selectedSubmission && statusBadge(selectedSubmission.status)}
            </DialogTitle>
            <DialogDescription>Review the business submission details below.</DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Business Name</p><p className="text-sm font-medium">{selectedSubmission.businessName}</p></div>
                <div><p className="text-xs text-muted-foreground">Category</p><p className="text-sm font-medium">{selectedSubmission.category}</p></div>
              </div>
              <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{selectedSubmission.description}</p></div>
              <div><p className="text-xs text-muted-foreground">Address</p><p className="text-sm">{selectedSubmission.address}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Phone</p><p className="text-sm">{selectedSubmission.phone || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Website</p><p className="text-sm">{selectedSubmission.website || '—'}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm">{selectedSubmission.email || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Owner Name</p><p className="text-sm">{selectedSubmission.ownerName}</p></div>
              </div>
              {selectedSubmission.message && (
                <div><p className="text-xs text-muted-foreground">Message</p><p className="text-sm">{selectedSubmission.message}</p></div>
              )}

              {/* Photos */}
              {(() => {
                const photos = selectedSubmission.images && selectedSubmission.images.length > 0
                  ? selectedSubmission.images
                  : (selectedSubmission.image ? [selectedSubmission.image] : [])
                if (photos.length === 0) return null
                return (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Photos <span className="text-muted-foreground/60">({photos.length})</span>
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {photos.map((src, i) => (
                        <a
                          key={`${src}-${i}`}
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-square rounded-lg overflow-hidden border bg-gray-50 hover:opacity-90 transition-opacity"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                          {i === 0 && (
                            <span className="absolute top-1 left-1 bg-amber-400 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Featured
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })()}

              <div><p className="text-xs text-muted-foreground">Submitted</p><p className="text-sm">{formatDate(selectedSubmission.createdAt)}</p></div>

              {selectedSubmission.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={() => handleStatusUpdate(selectedSubmission.id, 'approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve
                  </Button>
                  <Button onClick={() => handleStatusUpdate(selectedSubmission.id, 'rejected')} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                    <XCircle className="h-4 w-4 mr-1.5" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
