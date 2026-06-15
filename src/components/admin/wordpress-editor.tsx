'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import type { Editor as TinyMCEEditor } from 'tinymce'
import { ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WordPressEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

type EditorMode = 'visual' | 'code'

async function uploadImage(file: File): Promise<string | null> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
  if (!res.ok) return null
  const data = (await res.json()) as { url?: string }
  return data.url ?? null
}

export function WordPressEditor({
  value,
  onChange,
  placeholder = 'Start writing or type / to choose a block',
  minHeight = 320,
}: WordPressEditorProps) {
  const editorRef = useRef<TinyMCEEditor | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<EditorMode>('visual')
  const [codeValue, setCodeValue] = useState(value)

  useEffect(() => {
    if (mode === 'code') {
      setCodeValue(value)
    } else if (editorRef.current) {
      const current = editorRef.current.getContent()
      if (current !== value) {
        editorRef.current.setContent(value || '')
      }
    }
  }, [value, mode])

  const emitChange = useCallback(
    (html: string) => {
      const normalized = html.trim() === '' ? '' : html
      onChange(normalized)
    },
    [onChange],
  )

  function switchMode(next: EditorMode) {
    if (next === mode) return

    if (next === 'code') {
      const html = editorRef.current?.getContent() ?? value
      setCodeValue(html)
      emitChange(html)
    } else {
      emitChange(codeValue)
      requestAnimationFrame(() => {
        editorRef.current?.setContent(codeValue || '')
      })
    }

    setMode(next)
  }

  function handleCodeChange(html: string) {
    setCodeValue(html)
    emitChange(html)
  }

  async function handleAddMedia(file: File) {
    const url = await uploadImage(file)
    if (!url) {
      window.alert('Image upload failed.')
      return
    }

    if (mode === 'visual' && editorRef.current) {
      editorRef.current.insertContent(`<img src="${url}" alt="" />`)
      emitChange(editorRef.current.getContent())
    } else {
      const img = `<img src="${url}" alt="" />`
      handleCodeChange(codeValue + img)
    }
  }

  return (
    <div
      className="wp-editor-wrap"
      style={{ ['--wp-editor-min-height' as string]: `${minHeight}px` }}
    >
      <div className="wp-editor-tools">
        <div className="wp-media-buttons">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) await handleAddMedia(file)
              e.target.value = ''
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="wp-add-media h-7 text-xs gap-1.5 border-[#c3c4c7] bg-white hover:bg-[#f6f7f7] text-[#2271b1] shadow-none"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Add Media
          </Button>
        </div>
        <div className="wp-editor-tabs">
          <button
            type="button"
            className={cn('wp-switch-editor', mode === 'visual' && 'active')}
            onClick={() => switchMode('visual')}
          >
            Visual
          </button>
          <button
            type="button"
            className={cn('wp-switch-editor', mode === 'code' && 'active')}
            onClick={() => switchMode('code')}
          >
            Text
          </button>
        </div>
      </div>

      <div className="wp-editor-container">
        <div className={cn(mode !== 'visual' && 'hidden')}>
          <Editor
            tinymceScriptSrc="/tinymce/tinymce.min.js"
            licenseKey="gpl"
            value={value}
            onInit={(_evt, editor) => {
              editorRef.current = editor
            }}
            onEditorChange={(html) => emitChange(html)}
            init={{
              base_url: '/tinymce',
              suffix: '.min',
              height: minHeight,
              min_height: minHeight,
              menubar: false,
              branding: false,
              promotion: false,
              statusbar: true,
              resize: true,
              placeholder,
              plugins: [
                'lists', 'link', 'image', 'code', 'table', 'media', 'fullscreen',
                'wordcount', 'autoresize', 'charmap', 'searchreplace', 'autolink', 'anchor',
              ],
              toolbar:
                'blocks | bold italic underline strikethrough | bullist numlist | blockquote | ' +
                'alignleft aligncenter alignright | link image | wpmore wphr | removeformat | undo redo | ' +
                'charmap | outdent indent | fullscreen code',
              toolbar_mode: 'wrap',
              block_formats:
                'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6; Preformatted=pre',
              link_default_target: '_blank',
              link_assume_external_targets: true,
              relative_urls: false,
              convert_urls: false,
              images_upload_handler: async (blobInfo) => {
                const file = new File([blobInfo.blob()], blobInfo.filename(), {
                  type: blobInfo.blob().type,
                })
                const url = await uploadImage(file)
                if (!url) throw new Error('Upload failed')
                return url
              },
              setup: (editor) => {
                editor.ui.registry.addButton('wpmore', {
                  text: 'More',
                  tooltip: 'Insert Read More tag',
                  onAction: () => editor.insertContent('<!--more-->'),
                })
                editor.ui.registry.addButton('wphr', {
                  text: '—',
                  tooltip: 'Insert horizontal line',
                  onAction: () => editor.insertContent('<hr />'),
                })
              },
              content_style: `
                body {
                  font-family: Georgia, "Times New Roman", serif;
                  font-size: 16px;
                  line-height: 1.8;
                  color: #1d2327;
                  margin: 12px 16px;
                }
                p { margin: 0 0 1em; }
                img { max-width: 100%; height: auto; }
                blockquote {
                  border-left: 4px solid #c3c4c7;
                  margin: 1em 0;
                  padding: 0.5em 1em;
                  color: #50575e;
                }
              `,
            }}
          />
        </div>
        {mode === 'code' && (
          <textarea
            className="wp-html-editor"
            value={codeValue}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder={placeholder}
            spellCheck={false}
          />
        )}
      </div>
    </div>
  )
}
