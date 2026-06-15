'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { LISTING_DEFAULT_IMAGE } from '@/lib/listing-images'

interface ListingPhotosGalleryProps {
  name: string
  images: string[]
}

export function ListingPhotosGallery({ name, images: rawImages }: ListingPhotosGalleryProps) {
  const images = rawImages.length > 0 ? rawImages : [LISTING_DEFAULT_IMAGE]
  const [idx, setIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    setIdx(0)
    setLightboxOpen(false)
  }, [name, rawImages.join('|')])

  const hasMultiple = images.length > 1
  const safeIdx = Math.min(idx, images.length - 1)
  const currentSrc = images[safeIdx]

  const go = useCallback((delta: number) => {
    setIdx((cur) => (cur + delta + images.length) % images.length)
  }, [images.length])

  const openLightbox = useCallback((index: number) => {
    setIdx(index)
    setLightboxOpen(true)
  }, [])

  useEffect(() => {
    if (!lightboxOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [lightboxOpen, go])

  const touchStartX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) go(dx > 0 ? -1 : 1)
    touchStartX.current = null
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Photos</h3>

          <div
            className="relative rounded-xl overflow-hidden bg-gray-100 aspect-[16/10]"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={`${name}-${safeIdx}`}
                src={currentSrc}
                alt={`${name}${hasMultiple ? ` — photo ${safeIdx + 1}` : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 w-full h-full object-contain cursor-zoom-in bg-gray-100"
                onClick={() => openLightbox(safeIdx)}
              />
            </AnimatePresence>

            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md hover:bg-gray-50 flex items-center justify-center text-gray-700 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md hover:bg-gray-50 flex items-center justify-center text-gray-700 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {hasMultiple && (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => openLightbox(i)}
                  aria-current={i === safeIdx}
                  aria-label={`View photo ${i + 1}`}
                  className={`relative shrink-0 w-20 h-16 sm:w-24 sm:h-20 rounded-lg overflow-hidden border-2 transition-all cursor-zoom-in ${
                    i === safeIdx
                      ? 'border-orange-500 ring-2 ring-orange-200 opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`${name} photo gallery`}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(false) }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); go(-1) }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); go(1) }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  aria-label="Next"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full">
                  {safeIdx + 1} / {images.length}
                </div>
              </>
            )}

            <motion.img
              key={safeIdx}
              src={currentSrc}
              alt={name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
