'use client'

import { useRef, useState } from 'react'
import { ImagePlus, X, Star, ArrowUp, ArrowDown, Link as LinkIcon, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface MultiImageInputProps {
  value: string[]
  onChange: (next: string[]) => void
  maxImages?: number
  maxFileSizeMb?: number
}

export function MultiImageInput({
  value,
  onChange,
  maxImages = 12,
  maxFileSizeMb = 5,
}: MultiImageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [urlDraft, setUrlDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const remaining = maxImages - value.length

  const addImages = (urls: string[]) => {
    if (urls.length === 0) return
    const next = [...value, ...urls].slice(0, maxImages)
    onChange(next)
  }

  const handleFiles = (files: FileList | null) => {
    setError(null)
    if (!files || files.length === 0) return
    const fileArr = Array.from(files).slice(0, remaining)
    if (fileArr.length === 0) {
      setError(`Maximum ${maxImages} images allowed.`)
      return
    }

    Promise.all(
      fileArr.map(
        f =>
          new Promise<string | null>((resolve) => {
            if (!f.type.startsWith('image/')) return resolve(null)
            if (f.size > maxFileSizeMb * 1024 * 1024) return resolve(null)
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(f)
          }),
      ),
    ).then(results => {
      const valid = results.filter((r): r is string => !!r)
      if (valid.length < fileArr.length) {
        setError(`Some files were skipped (must be images < ${maxFileSizeMb} MB).`)
      }
      addImages(valid)
    })
  }

  const handleAddUrl = () => {
    const trimmed = urlDraft.trim()
    if (!trimmed) return
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('/') && !trimmed.startsWith('data:')) {
      setError('URL must start with http(s)://, / or data:')
      return
    }
    if (value.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed.`)
      return
    }
    setError(null)
    addImages([trimmed])
    setUrlDraft('')
  }

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx))
  }

  const moveTo = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {/* Existing images list */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {value.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className={`relative group rounded-lg overflow-hidden border ${
                idx === 0 ? 'border-amber-400 ring-2 ring-amber-200' : 'border-gray-200'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Image ${idx + 1}`} className="w-full aspect-[4/3] object-cover bg-gray-100" />

              {idx === 0 && (
                <div className="absolute top-1.5 left-1.5 bg-amber-400 text-amber-900 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-900" />
                  Featured
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-0.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6 bg-white/90 hover:bg-white"
                    onClick={() => moveTo(idx, idx - 1)}
                    disabled={idx === 0}
                    aria-label="Move image up"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6 bg-white/90 hover:bg-white"
                    onClick={() => moveTo(idx, idx + 1)}
                    disabled={idx === value.length - 1}
                    aria-label="Move image down"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-6 w-6"
                  onClick={() => removeAt(idx)}
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop / upload zone */}
      {value.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            handleFiles(e.dataTransfer.files)
          }}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
              <Upload className="h-4 w-4 text-gray-500" />
            </div>
            <p className="font-medium text-gray-700">
              {value.length === 0 ? 'Add images' : 'Add more'}
            </p>
            <p className="text-xs">
              Drag &amp; drop or click — {remaining} of {maxImages} slot{remaining === 1 ? '' : 's'} left
            </p>
          </div>
        </div>
      )}

      {/* URL input row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="…or paste an image URL"
            value={urlDraft}
            onChange={(e) => { setUrlDraft(e.target.value); setError(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl() } }}
            className="pl-9"
            disabled={value.length >= maxImages}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleAddUrl}
          disabled={!urlDraft.trim() || value.length >= maxImages}
        >
          <ImagePlus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          The first image is the <span className="font-medium text-amber-700">featured / cover image</span>.
          Drag the order arrows on each thumbnail to rearrange — the rest show as a carousel gallery on the listing page.
        </p>
      )}
    </div>
  )
}
