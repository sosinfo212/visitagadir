'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Link as LinkIcon, Loader2, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FeaturedImageInputProps {
  value: string
  onChange: (url: string) => void
  label?: string
  hint?: string
  accept?: string
  variant?: 'featured' | 'icon'
}

async function uploadImage(file: File): Promise<string | null> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
  if (!res.ok) return null
  const data = (await res.json()) as { url?: string }
  return data.url ?? null
}

function isValidImageUrl(url: string) {
  return (
    /^https?:\/\//i.test(url) ||
    url.startsWith('/') ||
    url.startsWith('data:image/')
  )
}

export function FeaturedImageInput({
  value,
  onChange,
  label = 'Featured image',
  hint = 'Shown on the blog listing and at the top of the post. Used for social sharing previews.',
  accept = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico',
  variant = 'featured',
}: FeaturedImageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [urlDraft, setUrlDraft] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const url = await uploadImage(file)
      if (!url) {
        setError('Upload failed. Try again or paste an image URL.')
        return
      }
      onChange(url)
    } finally {
      setUploading(false)
    }
  }

  function handleAddUrl() {
    const trimmed = urlDraft.trim()
    if (!trimmed) return
    if (!isValidImageUrl(trimmed)) {
      setError('URL must start with http(s)://, / or data:image/')
      return
    }
    setError(null)
    onChange(trimmed)
    setUrlDraft('')
  }

  const previewClass =
    variant === 'icon'
      ? 'relative rounded-xl overflow-hidden border bg-muted/30 aspect-square max-h-28 w-28'
      : 'relative rounded-xl overflow-hidden border bg-muted/30 aspect-[2/1] max-h-72'

  const emptyClass =
    variant === 'icon'
      ? 'w-28 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-orange-400/60 hover:bg-orange-50/40 transition-colors aspect-square max-h-28 flex flex-col items-center justify-center gap-2 text-muted-foreground'
      : 'w-full rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-orange-400/60 hover:bg-orange-50/40 transition-colors aspect-[2/1] max-h-56 flex flex-col items-center justify-center gap-2 text-muted-foreground'

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </div>

      {value ? (
        <div className={previewClass}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            className={variant === 'icon' ? 'w-full h-full object-contain p-2' : 'w-full h-full object-cover'}
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="bg-white/90 hover:bg-white"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
              onClick={() => onChange('')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={emptyClass}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <>
              <ImagePlus className={variant === 'icon' ? 'h-6 w-6' : 'h-8 w-8'} />
              <span className="text-sm font-medium">{variant === 'icon' ? 'Upload image' : 'Upload featured image'}</span>
              <span className="text-xs">JPEG, PNG, GIF, WebP, SVG, ICO · max 5 MB</span>
            </>
          )}
        </button>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Or paste image URL…"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
          />
        </div>
        <Button type="button" variant="outline" onClick={handleAddUrl} disabled={!urlDraft.trim()}>
          Add
        </Button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
