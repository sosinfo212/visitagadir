'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  FileText, Search, Plus, Pencil, Trash2, Loader2, Eye, EyeOff, Upload,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface BlogPost {
  id: string
  title: string
  slug: string
  status: string
  coverImage: string | null
  publishedAt: string | null
  category?: { id: string; name: string; slug: string } | null
}

interface ImportResult {
  postsImported: number
  postsSkipped: number
  postsFailed: number
  categoriesCreated: number
  mediaDownloaded: number
  mediaFailed: number
  errors: string[]
  message?: string
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [skipExisting, setSkipExisting] = useState(true)
  const [includeDrafts, setIncludeDrafts] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/admin/blog${q}`)
      if (res.ok) setPosts(await res.json())
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { loadPosts() }, [loadPosts])

  async function handleDelete() {
    if (!deleteId) return
    const res = await fetch(`/api/admin/blog/${deleteId}`, { method: 'DELETE' })
    if (res.ok) {
      setDeleteId(null)
      loadPosts()
    }
  }

  async function handleImport() {
    if (!importFile) {
      setImportError('Choose a WordPress XML export file first.')
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

      const res = await fetch('/api/admin/blog/import', {
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
      await loadPosts()
    } catch {
      setImportError('Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Blog posts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage blog posts with live SEO scoring.</p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="h-4 w-4 mr-2" />
            New post
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5" />
            Import from WordPress
          </CardTitle>
          <CardDescription>
            Upload a WordPress WXR export (.xml). Posts, categories, and images are imported locally into the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="wp-xml">WordPress export file</Label>
              <Input
                id="wp-xml"
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
                  Import posts
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={skipExisting} onCheckedChange={(v) => setSkipExisting(v === true)} />
              Skip posts that already exist (by slug)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={includeDrafts} onCheckedChange={(v) => setIncludeDrafts(v === true)} />
              Include draft posts
            </label>
          </div>

          {importError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{importError}</p>
          )}

          {importResult && (
            <div className="text-sm bg-green-50 border border-green-100 rounded-lg px-4 py-3 space-y-2">
              <p className="font-medium text-green-800">{importResult.message || 'Import completed.'}</p>
              <ul className="text-green-900 grid sm:grid-cols-2 gap-1">
                <li>Posts imported: {importResult.postsImported}</li>
                <li>Posts skipped: {importResult.postsSkipped}</li>
                <li>Posts failed: {importResult.postsFailed}</li>
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

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search posts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No blog posts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      {post.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.coverImage}
                          alt=""
                          className="h-10 w-14 rounded object-cover border bg-muted"
                        />
                      ) : (
                        <div className="h-10 w-14 rounded border bg-muted flex items-center justify-center text-muted-foreground">
                          <FileText className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{post.title}</TableCell>
                    <TableCell>
                      {post.category ? (
                        <Badge variant="outline" className="font-normal">
                          {post.category.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{post.slug}</TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                        {post.status === 'published' ? (
                          <><Eye className="h-3 w-3 mr-1" /> Published</>
                        ) : (
                          <><EyeOff className="h-3 w-3 mr-1" /> Draft</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(post.publishedAt)}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {post.status === 'published' && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/blog/${post.slug}`} target="_blank">View</Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/blog/${post.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(post.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
