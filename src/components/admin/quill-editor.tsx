'use client'

import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

interface QuillEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

type QuillToolbar = {
  addHandler: (name: string, handler: (value?: string) => void) => void
}

function insertImageAt(quill: Quill, url: string) {
  const range = quill.getSelection(true)
  const index = range?.index ?? quill.getLength()
  quill.insertEmbed(index, 'image', url, 'user')
  quill.setSelection(index + 1)
}

async function uploadImage(file: File): Promise<string | null> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
  if (!res.ok) return null
  const data = (await res.json()) as { url?: string }
  return data.url ?? null
}

export function QuillEditor({
  value,
  onChange,
  placeholder = 'Write your post content…',
  minHeight = 320,
}: QuillEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const onChangeRef = useRef(onChange)
  const lastHtmlRef = useRef(value)

  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return

    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'link', 'image'],
          ['clean'],
        ],
      },
    })

    const toolbar = quill.getModule('toolbar') as QuillToolbar

    toolbar.addHandler('link', () => {
      const range = quill.getSelection(true)
      if (!range) {
        window.alert('Place the cursor in the editor or select text first.')
        return
      }

      const existing = (quill.getFormat(range).link as string | undefined) ?? ''
      const url = window.prompt('Enter link URL (leave empty to remove link):', existing || 'https://')
      if (url === null) return

      const trimmed = url.trim()
      if (!trimmed) {
        quill.format('link', false)
        return
      }

      const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

      if (range.length === 0) {
        quill.insertText(range.index, href, { link: href })
        quill.setSelection(range.index + href.length)
      } else {
        quill.format('link', href)
      }
    })

    toolbar.addHandler('image', () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/jpeg,image/png,image/gif,image/webp'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) {
          const url = window.prompt('Enter image URL:')
          if (url?.trim()) insertImageAt(quill, url.trim())
          return
        }

        const uploaded = await uploadImage(file)
        if (uploaded) {
          insertImageAt(quill, uploaded)
          return
        }

        const url = window.prompt('Upload failed. Enter image URL instead:')
        if (url?.trim()) insertImageAt(quill, url.trim())
      }
      input.click()
    })

    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value)
      lastHtmlRef.current = quill.root.innerHTML
    }

    quill.on('text-change', () => {
      const html = quill.root.innerHTML
      const normalized = html === '<p><br></p>' ? '' : html
      lastHtmlRef.current = normalized
      onChangeRef.current(normalized)
    })

    quillRef.current = quill

    return () => {
      quillRef.current = null
    }
  }, [placeholder])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill) return
    const normalized = value || ''
    if (normalized !== lastHtmlRef.current) {
      if (!normalized) {
        quill.setText('')
      } else {
        quill.clipboard.dangerouslyPasteHTML(normalized)
      }
      lastHtmlRef.current = quill.root.innerHTML
    }
  }, [value])

  return (
    <div
      className="blog-quill-editor rounded-lg border border-input bg-background"
      style={{ ['--editor-min-height' as string]: `${minHeight}px` }}
    >
      <div ref={containerRef} />
    </div>
  )
}
