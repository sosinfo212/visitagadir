'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, MapPin, Star, Phone, Globe, Mail, ChevronRight, ChevronLeft,
  UtensilsCrossed, Hotel, Waves, ShoppingBag, Heart, GraduationCap,
  Car, Briefcase, Music, Compass, Home as HomeIcon, Sparkles, ArrowUp,
  Menu, X, Filter, ExternalLink, Award, Users, ArrowLeft, Sun, Plus,
  ChevronDown, CheckCircle2, Building2, Send, Newspaper, Calendar, LogIn,
} from 'lucide-react'
import { isHtmlContent, stripHtml } from '@/lib/blog/html'
import { LISTING_DEFAULT_IMAGE } from '@/lib/listing-images'
import { listingWebsiteHref } from '@/lib/listing-contact'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MultiImageInput } from '@/components/multi-image-input'
import { categoryBgColors, getCategoryIcon } from '@/lib/category-icons'
import { DynamicAdSlot } from '@/components/dynamic-ad-slot'
import type { HomepageInitialData } from '@/lib/homepage-data'

// Types
interface Category {
  id: string
  name: string
  slug: string
  icon: string
  description: string
  _count?: { listings: number }
}

interface CategoryWithCount extends Category {
  listingCount: number
}

interface Listing {
  id: string
  name: string
  slug: string
  description: string
  address: string
  phone: string | null
  website: string | null
  email: string | null
  image: string | null
  /** Full ordered image list: [0] is the featured / cover image, the rest are gallery shots */
  images?: string[]
  rating: number
  reviewCount: number
  featured: boolean
  categoryId: string
  category: {
    name: string
    slug: string
    icon: string
  }
}

interface Review {
  id: string
  authorName: string
  rating: number
  comment: string
  listingId: string
  createdAt: string
  ownerReply?: string | null
  ownerRepliedAt?: string | null
}

interface BlogPostCard {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  authorName: string
  publishedAt: string | null
  category: { name: string; slug: string }
}

const categoryColors: Record<string, string> = {
  'restaurants-cafes': 'from-orange-500 to-red-500',
  'hotels-accommodation': 'from-purple-500 to-indigo-500',
  'beaches-water-sports': 'from-cyan-500 to-blue-500',
  'shopping-markets': 'from-pink-500 to-rose-500',
  'health-wellness': 'from-red-500 to-pink-500',
  'education-training': 'from-blue-500 to-cyan-500',
  'transport-car-rental': 'from-emerald-500 to-teal-500',
  'professional-services': 'from-slate-500 to-gray-600',
  'nightlife-entertainment': 'from-violet-500 to-purple-500',
  'tours-excursions': 'from-amber-500 to-orange-500',
  'home-services': 'from-lime-500 to-green-500',
  'beauty-personal-care': 'from-fuchsia-500 to-pink-500',
}

// Star rating component
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </div>
  )
}

// Interactive star selector for review form
function InteractiveStarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="focus:outline-none transition-transform hover:scale-110"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= (hovered || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-200 fill-gray-200'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-medium text-muted-foreground">{value} star{value !== 1 ? 's' : ''}</span>
      )}
    </div>
  )
}

// Scroll to top button
function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-6 left-6 z-50"
    >
      <Button
        size="icon"
        aria-label="Scroll to top"
        className="rounded-full shadow-lg h-12 w-12 bg-gradient-to-r from-orange-500 to-teal-500 text-white hover:from-orange-600 hover:to-teal-600 hover:text-white"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ArrowUp className="h-6 w-6 text-white stroke-[2.5]" aria-hidden="true" />
      </Button>
    </motion.div>
  )
}

// ─── Listing image helpers ───
// Returns the ordered list of images for a listing. Prefers the new `images`
// array (index 0 = featured); falls back to the legacy single `image` field.
function getListingImages(listing: Listing): string[] {
  if (Array.isArray(listing.images) && listing.images.length > 0) return listing.images
  if (listing.image) return [listing.image]
  return [LISTING_DEFAULT_IMAGE]
}

function getListingCardImage(listing: Listing): string {
  return getListingImages(listing)[0]
}

// Card-styled "Photos" gallery for the listing detail page. Rendered above
// the About section. Single image -> just shows the image.
// Multiple -> main image + prev/next arrows + thumbnail row + lightbox.
function ListingPhotosGallery({ listing }: { listing: Listing }) {
  const images = getListingImages(listing)
  const [idx, setIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Reset to the first image whenever we switch listings
  useEffect(() => { setIdx(0) }, [listing.id])

  const hasMultiple = images.length > 1

  const go = useCallback((delta: number) => {
    if (images.length === 0) return
    setIdx((cur) => (cur + delta + images.length) % images.length)
  }, [images.length])

  // Touch swipe on the main image
  const touchStartX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) go(dx > 0 ? -1 : 1)
    touchStartX.current = null
  }

  // Show the gallery card even when only the default placeholder is available.
  if (images.length === 0) return null

  const currentSrc = images[idx]
  const safeIdx = Math.min(idx, images.length - 1)

  return (
    <>
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Photos</h3>

          {/* Main image */}
          <div
            className="relative rounded-xl overflow-hidden bg-gray-100 aspect-[16/10]"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={`${listing.id}-${safeIdx}`}
                src={currentSrc}
                alt={`${listing.name}${hasMultiple ? ` — photo ${safeIdx + 1}` : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 w-full h-full object-contain cursor-zoom-in bg-gray-100"
                onClick={() => setLightboxOpen(true)}
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

          {/* Thumbnail strip */}
          {hasMultiple && (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-current={i === safeIdx}
                  aria-label={`View photo ${i + 1}`}
                  className={`relative shrink-0 w-20 h-16 sm:w-24 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
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

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
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
              alt={listing.name}
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


// ─── Animated Hero Section with Mouse Effects ───
function AnimatedHeroSection({
  categories,
  featuredListings,
  searchQuery,
  setSearchQuery,
  handleSearch,
  handleCategoryClick,
}: {
  categories: CategoryWithCount[]
  featuredListings: Listing[]
  searchQuery: string
  setSearchQuery: (q: string) => void
  handleSearch: () => void
  handleCategoryClick: (slug: string) => void
}) {
  const heroRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [isHovering, setIsHovering] = useState(false)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; color: string; delay: number }>>([])
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const particleIdRef = useRef(0)

  // Generate random particles on mount
  useEffect(() => {
    const colors = ['#f97316', '#14b8a6', '#fbbf24', '#f472b6', '#a78bfa', '#34d399']
    const p = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 5,
    }))
    setParticles(p)
  }, [])

  // Mouse tracking with smooth interpolation
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMousePos({ x, y })
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    setMousePos({ x: 0.5, y: 0.5 })
  }, [])

  // Click ripple effect
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    const id = Date.now()
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 1500)
  }, [])

  // Parallax offsets based on mouse position
  const px = (mousePos.x - 0.5) * 2 // -1 to 1
  const py = (mousePos.y - 0.5) * 2

  // 3D tilt transform
  const tiltX = isHovering ? py * -8 : 0
  const tiltY = isHovering ? px * 8 : 0

  // Letter-by-letter text animation
  const titleLine1 = "Discover the Best of"
  const titleLine2 = "Agadir City"

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden min-h-[85vh] sm:min-h-[90vh] flex items-center"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ perspective: '1200px' }}
    >
      {/* ── Background Image with Parallax ── */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{ backgroundImage: "url('/agadir-hero.jpg')" }}
        animate={{
          x: isHovering ? px * -20 : 0,
          y: isHovering ? py * -20 : 0,
          scale: isHovering ? 1.05 : 1.1,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 30 }}
      />

      {/* ── Animated Gradient Overlay ── */}
      <motion.div
        className="absolute inset-0 z-10"
        animate={{
          background: isHovering
            ? `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(249,115,22,0.75) 0%, rgba(13,148,136,0.85) 40%, rgba(154,52,18,0.9) 100%)`
            : 'linear-gradient(135deg, rgba(234,88,12,0.9) 0%, rgba(13,148,136,0.85) 50%, rgba(154,52,18,0.9) 100%)',
        }}
        transition={{ duration: 0.4 }}
      />

      {/* ── Cursor Glow Effect ── */}
      {isHovering && (
        <motion.div
          className="absolute z-10 pointer-events-none"
          animate={{
            left: `${mousePos.x * 100}%`,
            top: `${mousePos.y * 100}%`,
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          style={{
            width: '400px',
            height: '400px',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
            borderRadius: '50%',
          }}
        />
      )}

      {/* ── Floating Particles ── */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              left: `${p.x}%`,
              top: `${p.y}%`,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            }}
            animate={{
              x: isHovering ? px * (20 + p.delay * 5) : Math.sin(Date.now() / 1000 + p.delay) * 10,
              y: isHovering ? py * (20 + p.delay * 5) : Math.cos(Date.now() / 1000 + p.delay) * 10,
              opacity: isHovering ? [0.4, 0.8, 0.4] : [0.2, 0.5, 0.2],
              scale: isHovering ? [1, 1.5, 1] : [1, 1.2, 1],
            }}
            transition={{
              duration: isHovering ? 1.5 : 4,
              repeat: Infinity,
              delay: p.delay * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* ── Click Ripples ── */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {ripples.map((r) => (
          <motion.div
            key={r.id}
            className="absolute rounded-full border-2 border-white/40"
            initial={{
              left: r.x,
              top: r.y,
              width: 0,
              height: 0,
              opacity: 0.8,
              x: '-50%',
              y: '-50%',
            }}
            animate={{
              width: 300,
              height: 300,
              opacity: 0,
            }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        ))}
      </div>

      {/* ── Floating Moroccan Decorative Elements ── */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {/* Arch shape - top left */}
        <motion.div
          className="absolute -top-10 -left-10 w-48 h-48 sm:w-72 sm:h-72 border-[3px] border-white/10 rounded-t-full"
          animate={{
            x: isHovering ? px * 30 : 0,
            y: isHovering ? py * 30 : 0,
            rotate: isHovering ? px * 5 : 0,
          }}
          transition={{ type: 'spring', stiffness: 40, damping: 25 }}
        />
        {/* Diamond shape - top right */}
        <motion.div
          className="absolute -top-8 -right-8 w-32 h-32 sm:w-48 sm:h-48 border-[2px] border-white/8 rotate-45"
          animate={{
            x: isHovering ? px * -25 : 0,
            y: isHovering ? py * 25 : 0,
            rotate: isHovering ? 45 + px * 10 : 45,
          }}
          transition={{ type: 'spring', stiffness: 45, damping: 25 }}
        />
        {/* Circle - bottom left */}
        <motion.div
          className="absolute -bottom-16 -left-16 w-64 h-64 sm:w-96 sm:h-96 border-[2px] border-white/5 rounded-full"
          animate={{
            x: isHovering ? px * 15 : 0,
            y: isHovering ? py * -15 : 0,
          }}
          transition={{ type: 'spring', stiffness: 35, damping: 25 }}
        />
        {/* Large circle - bottom right */}
        <motion.div
          className="absolute -bottom-24 -right-24 w-80 h-80 sm:w-[500px] sm:h-[500px] border border-white/5 rounded-full"
          animate={{
            x: isHovering ? px * -10 : 0,
            y: isHovering ? py * -10 : 0,
          }}
          transition={{ type: 'spring', stiffness: 30, damping: 25 }}
        />
        {/* Small floating dot cluster */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`dot-${i}`}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${15 + i * 14}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              x: isHovering ? px * (10 + i * 5) : Math.sin(i) * 5,
              y: isHovering ? py * (10 + i * 5) : Math.cos(i) * 5,
              opacity: isHovering ? 0.5 : 0.2,
            }}
            transition={{ type: 'spring', stiffness: 50 + i * 10, damping: 25 }}
          />
        ))}
        {/* Moroccan star pattern - top center */}
        <motion.div
          className="absolute top-10 left-1/2 -translate-x-1/2"
          animate={{
            x: isHovering ? px * 20 : 0,
            y: isHovering ? py * 20 : 0,
            rotate: isHovering ? px * 15 : 0,
            opacity: isHovering ? 0.15 : 0.06,
          }}
          transition={{ type: 'spring', stiffness: 40, damping: 25 }}
        >
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <path d="M60 0L73.5 46.5L120 60L73.5 73.5L60 120L46.5 73.5L0 60L46.5 46.5L60 0Z" fill="white" fillOpacity="0.3" />
          </svg>
        </motion.div>
      </div>

      {/* ── Main Content with 3D Tilt ── */}
      <motion.div
        className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 w-full"
        animate={{
          rotateX: tiltX,
          rotateY: tiltY,
        }}
        transition={{ type: 'spring', stiffness: 60, damping: 25 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="text-center space-y-6 sm:space-y-8">
          {/* Location Badge */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{ transform: 'translateZ(40px)' }}
          >
            <Badge className="bg-white/15 text-white border-white/25 hover:bg-white/25 px-5 py-1.5 text-sm backdrop-blur-sm cursor-default">
              <motion.span
                animate={{ rotate: isHovering ? [0, 10, -10, 0] : 0 }}
                transition={{ duration: 0.5 }}
              >
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
              </motion.span>
              Agadir, Morocco
            </Badge>
          </motion.div>

          {/* Title with letter-by-letter animation */}
          <div style={{ transform: 'translateZ(60px)' }}>
            <motion.div className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
              {/* Line 1: letter animation */}
              <span className="inline-flex flex-wrap justify-center">
                {titleLine1.split('').map((char, i) => (
                  <motion.span
                    key={`l1-${i}`}
                    initial={{ y: 60, opacity: 0, rotateX: -90 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    transition={{ delay: 0.3 + i * 0.03, duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
                    className="inline-block"
                    style={{
                      textShadow: isHovering
                        ? `${px * 4}px ${py * 4}px 20px rgba(0,0,0,0.3)`
                        : '0 0 0 transparent',
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </span>
              <br />
              {/* Line 2: gradient text with wave animation */}
              <motion.span
                className="inline-flex flex-wrap justify-center bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: isHovering ? ['0% 50%', '100% 50%', '0% 50%'] : undefined,
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                  backgroundSize: '200% 100%',
                  textShadow: isHovering ? `${px * 6}px ${py * 6}px 30px rgba(251,191,36,0.3)` : 'none',
                  filter: isHovering ? `drop-shadow(0 0 ${8}px rgba(251,191,36,0.4))` : 'none',
                }}
              >
                {titleLine2.split('').map((char, i) => (
                  <motion.span
                    key={`l2-${i}`}
                    initial={{ y: 80, opacity: 0, scale: 0.5 }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{ delay: 0.6 + i * 0.04, duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
                    className="inline-block"
                    whileHover={{
                      scale: 1.3,
                      y: -8,
                      transition: { duration: 0.2 },
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </motion.span>
            </motion.div>
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="text-lg sm:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed"
            style={{ transform: 'translateZ(30px)' }}
          >
            Your ultimate guide to restaurants, hotels, beaches, shopping, services, and everything Agadir has to offer.
          </motion.p>

          {/* Search Bar with Magnetic Effect */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto"
            style={{ transform: 'translateZ(50px)' }}
          >
            <motion.div
              className="relative w-full"
              animate={{
                x: isHovering ? px * 5 : 0,
                y: isHovering ? py * 5 : 0,
              }}
              transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
              <Input
                placeholder="What are you looking for?"
                className="pl-11 h-13 text-base rounded-2xl border-0 shadow-2xl backdrop-blur-md bg-white/95 focus-visible:ring-2 focus-visible:ring-orange-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </motion.div>
            <motion.div
              animate={{
                x: isHovering ? px * 8 : 0,
                y: isHovering ? py * 8 : 0,
              }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                size="lg"
                className="h-13 px-8 bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white font-semibold rounded-2xl shadow-2xl w-full sm:w-auto border-0"
                onClick={handleSearch}
              >
                <motion.span
                  animate={{ x: isHovering ? [0, 3, 0] : 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-2"
                >
                  Explore Now
                  <ChevronRight className="h-4 w-4" />
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Quick Category Pills */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-2 pt-2"
            style={{ transform: 'translateZ(25px)' }}
          >
            {categories.slice(0, 5).map((cat, i) => (
              <motion.button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/80 text-sm hover:bg-white/20 hover:text-white transition-all duration-300 flex items-center gap-1.5"
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  x: isHovering ? px * (3 + i * 2) : 0,
                  y: isHovering ? py * (3 + i * 2) : 0,
                }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                initial={{ opacity: 0, scale: 0.8 }}
                viewport={{ once: true }}
              >
                <span className="opacity-70">{getCategoryIcon(cat.icon)}</span>
                <span className="hidden sm:inline text-xs">{cat.name.split(' & ')[0]}</span>
              </motion.button>
            ))}
          </motion.div>

          {/* Stats with counter animation */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.6 }}
            className="flex items-center justify-center gap-6 sm:gap-10 pt-4"
            style={{ transform: 'translateZ(20px)' }}
          >
            {[
              { value: categories.length, label: 'Categories' },
              { value: featuredListings.length + 15, label: 'Listings', suffix: '+' },
              { value: 4.5, label: 'Avg Rating', isDecimal: true },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                animate={{
                  x: isHovering ? px * (2 + i * 3) : 0,
                  y: isHovering ? py * (2 + i * 3) : 0,
                }}
                transition={{ type: 'spring', stiffness: 80, damping: 20 }}
              >
                <motion.div
                  className="text-2xl sm:text-3xl font-bold text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.8 + i * 0.1, type: 'spring', stiffness: 200 }}
                >
                  {stat.isDecimal ? stat.value : stat.value}
                  {stat.suffix || ''}
                </motion.div>
                <div className="text-xs sm:text-sm text-white/50 mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
            {/* Separators */}
            <div className="absolute flex items-center justify-center gap-6 sm:gap-10 w-full pointer-events-none">
              <div className="w-px h-8 bg-white/15" />
              <div className="w-px h-8 bg-white/15" />
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="pt-6 sm:pt-8"
            style={{ transform: 'translateZ(10px)' }}
          >
            <motion.div
              className="flex flex-col items-center gap-1.5 text-white/40 cursor-pointer"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              onClick={() => {
                const el = document.getElementById('categories-section')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span className="text-xs tracking-widest uppercase">Scroll to explore</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 4v12M4 10l6 6 6-6" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Animated Wave Bottom Border ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <motion.path
            d="M0 60L48 52C96 44 192 28 288 32C384 36 480 60 576 68C672 76 768 68 864 56C960 44 1056 28 1152 28C1248 28 1344 44 1392 52L1440 60V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V60Z"
            fill="white"
            animate={{
              d: isHovering
                ? "M0 80L48 68C96 56 192 32 288 36C384 40 480 72 576 76C672 80 768 60 864 48C960 36 1056 32 1152 36C1248 40 1344 52 1392 58L1440 64V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V80Z"
                : "M0 60L48 52C96 44 192 28 288 32C384 36 480 60 576 68C672 76 768 68 864 56C960 44 1056 28 1152 28C1248 28 1344 44 1392 52L1440 60V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V60Z",
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        </svg>
      </div>
    </section>
  )
}

// Main App
export default function Home({
  initialListingSlug,
  initialData,
}: {
  initialListingSlug?: string
  initialData?: HomepageInitialData
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [categories, setCategories] = useState<CategoryWithCount[]>(initialData?.categories ?? [])
  const [listings, setListings] = useState<Listing[]>([])
  const [featuredListings, setFeaturedListings] = useState<Listing[]>(initialData?.featuredListings ?? [])
  const [latestBlogPosts, setLatestBlogPosts] = useState<BlogPostCard[]>(initialData?.latestBlogPosts ?? [])
  const [siteBranding, setSiteBranding] = useState(
    initialData?.siteBranding ?? {
      siteName: 'Agadir Directory',
      siteLogoUrl: '/agadir-logo.png',
      siteLogoWidth: 32,
      siteLogoHeight: 32,
      footerLogoUrl: '/agadir-logo.png',
      footerLogoWidth: 32,
      footerLogoHeight: 32,
    },
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [listingSlugLoading, setListingSlugLoading] = useState(!!initialListingSlug)
  const [view, setView] = useState<'home' | 'category' | 'listing'>(initialListingSlug ? 'listing' : 'home')
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewForm, setReviewForm] = useState({ authorName: '', rating: 0, comment: '' })
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [relatedListings, setRelatedListings] = useState<Listing[]>([])

  // Deep-link: /listing/[slug] opens the same listing detail UI as the homepage
  useEffect(() => {
    if (!initialListingSlug) return

    let cancelled = false
    setListingSlugLoading(true)

    fetch(`/api/listings?slug=${encodeURIComponent(initialListingSlug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((listing: Listing | null) => {
        if (cancelled || !listing?.id) return
        setSelectedListing(listing)
        setActiveCategory(listing.category.slug)
        setView('listing')
        setReviewForm({ authorName: '', rating: 0, comment: '' })
        setReviewError('')
        setReviewSuccess(false)
        fetch(`/api/reviews?listingId=${listing.id}`)
          .then((res) => res.json())
          .then((data) => { if (!cancelled) setReviews(Array.isArray(data) ? data : []) })
          .catch(() => { if (!cancelled) setReviews([]) })
      })
      .finally(() => {
        if (!cancelled) setListingSlugLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [initialListingSlug])

  // Load homepage data client-side only when not server-provided
  useEffect(() => {
    if (initialData) return

    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/listings?featured=true').then((r) => r.json()),
      fetch('/api/blog/latest').then((r) => r.json()).catch(() => []),
      fetch('/api/settings/public').then((r) => r.json()).catch(() => null),
    ])
      .then(([cats, feat, posts, branding]) => {
        const catsWithCount = cats.map((c: Category & { _count?: { listings: number } }) => ({
          ...c,
          listingCount: c._count?.listings || 0,
        }))
        setCategories(catsWithCount)
        setFeaturedListings(feat)
        setLatestBlogPosts(Array.isArray(posts) ? posts : [])
        if (branding?.siteName) {
          setSiteBranding({
            siteName: branding.siteName,
            siteLogoUrl: branding.siteLogoUrl || '/agadir-logo.png',
            siteLogoWidth: branding.siteLogoWidth || 32,
            siteLogoHeight: branding.siteLogoHeight || 32,
            footerLogoUrl: branding.footerLogoUrl || branding.siteLogoUrl || '/agadir-logo.png',
            footerLogoWidth: branding.footerLogoWidth || 32,
            footerLogoHeight: branding.footerLogoHeight || 32,
          })
        }
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [initialData])

  // Fetch listings when category changes
  const fetchListings = useCallback(async (categorySlug: string | null, search?: string) => {
    setIsLoading(true)
    const params = new URLSearchParams()
    if (categorySlug) params.set('category', categorySlug)
    if (search) params.set('search', search)

    const res = await fetch(`/api/listings?${params.toString()}`)
    const data = await res.json()
    setListings(data)
    setIsLoading(false)
  }, [])

  const handleCategoryClick = (slug: string) => {
    setActiveCategory(slug)
    setView('category')
    fetchListings(slug, searchQuery)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearch = () => {
    if (activeCategory) {
      fetchListings(activeCategory, searchQuery)
      setView('category')
    } else {
      fetchListings(null, searchQuery)
      if (searchQuery.trim()) {
        setView('category')
        router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`)
      }
    }
  }

  const handleBackToHome = () => {
    if (initialListingSlug) {
      router.push('/')
      return
    }
    setView('home')
    setActiveCategory(null)
    setSelectedListing(null)
    setSearchQuery('')
    setListings([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToCategory = () => {
    if (initialListingSlug && selectedListing) {
      router.push(`/category/${encodeURIComponent(selectedListing.category.slug)}`)
      return
    }
    setView('category')
    setSelectedListing(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const fetchReviews = async (listingId: string) => {
    try {
      const res = await fetch(`/api/reviews?listingId=${listingId}`)
      const data = await res.json()
      setReviews(data)
    } catch {
      setReviews([])
    }
  }

  useEffect(() => {
    if (!selectedListing?.category?.slug) {
      setRelatedListings([])
      return
    }

    let cancelled = false
    fetch(`/api/listings?category=${encodeURIComponent(selectedListing.category.slug)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Listing[]) => {
        if (cancelled) return
        setRelatedListings(
          data.filter((listing) => listing.id !== selectedListing.id).slice(0, 5),
        )
      })
      .catch(() => {
        if (!cancelled) setRelatedListings([])
      })

    return () => {
      cancelled = true
    }
  }, [selectedListing?.id, selectedListing?.category?.slug])

  const handleListingClick = (listing: Listing) => {
    if (listing.slug) {
      router.push(`/listing/${encodeURIComponent(listing.slug)}`)
      return
    }
    setSelectedListing(listing)
    setView('listing')
    setReviewForm({ authorName: '', rating: 0, comment: '' })
    setReviewError('')
    setReviewSuccess(false)
    fetchReviews(listing.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setReviewError('')
    if (!reviewForm.authorName || reviewForm.rating === 0 || !reviewForm.comment) {
      setReviewError('Please fill in all fields and select a rating.')
      return
    }
    setIsSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reviewForm, listingId: selectedListing?.id }),
      })
      if (!res.ok) throw new Error('Review submission failed')
      // Review is submitted but NOT shown immediately — it needs admin approval
      // Don't add to reviews list since it's pending approval
      setReviewForm({ authorName: '', rating: 0, comment: '' })
      setReviewSuccess(true)
      setTimeout(() => setReviewSuccess(false), 5000)
    } catch {
      setReviewError('Something went wrong. Please try again.')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const activeCategoryData = useMemo(() => categories.find(c => c.slug === activeCategory), [categories, activeCategory])

  const urlSearch = searchParams.get('search')?.trim() ?? ''

  useEffect(() => {
    if (!urlSearch) return
    setSearchQuery(urlSearch)
    setView('category')
    setActiveCategory(null)
    fetchListings(null, urlSearch)
  }, [urlSearch, fetchListings])

  // Loading skeleton
  if (isLoading && view === 'home' && categories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-teal-500 animate-pulse" />
          <p className="text-muted-foreground">Loading Agadir Directory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {/* HOME VIEW */}
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Animated Hero Section */}
              <AnimatedHeroSection
                categories={categories}
                featuredListings={featuredListings}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearch={handleSearch}
                handleCategoryClick={handleCategoryClick}
              />

              {/* Ad Banner - Top */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <DynamicAdSlot location="header_banner" className="mt-2" />
              </div>

              {/* Categories Grid */}
              <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-10">
                  <h3 className="text-2xl sm:text-3xl font-bold">Browse by Category</h3>
                  <p className="text-muted-foreground mt-2">Find exactly what you need in Agadir</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {categories.map((cat, index) => (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleCategoryClick(cat.slug)}
                      className={`group relative p-4 sm:p-5 rounded-2xl border text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                        categoryBgColors[cat.slug] || 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${categoryColors[cat.slug] || 'from-gray-400 to-gray-500'} text-white mb-3 shadow-sm`}>
                        {getCategoryIcon(cat.icon)}
                      </div>
                      <h4 className="font-semibold text-sm sm:text-base leading-tight mb-1">{cat.name}</h4>
                      <p className="text-xs text-muted-foreground">{cat.listingCount} listings</p>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* Featured Listings */}
              <section className="bg-gradient-to-b from-muted/30 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold">Featured in Agadir</h3>
                      <p className="text-muted-foreground mt-1">Top-rated and recommended places</p>
                    </div>
                    <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" />
                      Editor&apos;s Pick
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {featuredListings.slice(0, 9).map((listing, index) => (
                      <motion.div
                        key={listing.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.07 }}
                      >
                        <Card
                          className="cursor-pointer group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-0 shadow-sm"
                          onClick={() => handleListingClick(listing)}
                        >
                          {/* Image header */}
                          <div className="relative h-40 overflow-hidden">
                            <img
                              src={getListingCardImage(listing)}
                              alt={listing.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {listing.featured && (
                              <Badge className="absolute top-2.5 right-2.5 bg-amber-100 text-amber-700 border-amber-200 shadow-sm">
                                <Award className="h-3 w-3 mr-1" />Featured
                              </Badge>
                            )}
                            <Badge variant="secondary" className="absolute bottom-2.5 left-2.5 text-xs bg-white/90 backdrop-blur-sm">
                              {listing.category.name}
                            </Badge>
                          </div>
                          <CardContent className="p-5">
                            <h4 className="font-semibold text-base group-hover:text-orange-600 transition-colors leading-tight mb-2">
                              {listing.name}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{stripHtml(listing.description)}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <StarRating rating={listing.rating} />
                              <span className="text-sm font-medium">{listing.rating}</span>
                              <span className="text-xs text-muted-foreground">({listing.reviewCount} reviews)</span>
                            </div>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.address + ', Agadir, Morocco')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-orange-600 transition-colors group"
                            >
                              <MapPin className="h-3.5 w-3.5 shrink-0 group-hover:text-orange-600" />
                              <span className="truncate">{listing.address}</span>
                              <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Ad in middle of featured section */}
                  <div className="mt-8">
                    <DynamicAdSlot location="featured_feed" />
                  </div>
                </div>
              </section>

              {/* Our Latest Posts */}
              {latestBlogPosts.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold">Our Latest Posts</h3>
                      <p className="text-muted-foreground mt-1">Travel tips, guides, and stories from Agadir</p>
                    </div>
                    <Link href="/blog">
                      <Button variant="outline" size="sm" className="hidden sm:flex">
                        View all posts
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {latestBlogPosts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                      >
                        <Link href={`/blog/${post.slug}`}>
                          <Card className="group h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-0 shadow-sm">
                            <div className="relative h-44 overflow-hidden bg-gradient-to-br from-orange-100 to-teal-100">
                              {post.coverImage ? (
                                <img
                                  src={post.coverImage}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Newspaper className="h-12 w-12 text-orange-300" />
                                </div>
                              )}
                              <Badge variant="secondary" className="absolute top-2.5 left-2.5 text-xs bg-white/90 backdrop-blur-sm">
                                {post.category.name}
                              </Badge>
                            </div>
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-base group-hover:text-orange-600 transition-colors leading-snug line-clamp-2 mb-2">
                                {post.title}
                              </h4>
                              {post.excerpt && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {post.publishedAt
                                    ? new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : 'Draft'}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-6 text-center sm:hidden">
                    <Link href="/blog">
                      <Button variant="outline" size="sm">
                        View all posts
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </section>
              )}

              {/* About Agadir */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold mb-4">Welcome to Agadir</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Agadir is a vibrant coastal city in southern Morocco, renowned for its stunning beaches, year-round sunshine, and warm hospitality. Rebuilt after a devastating earthquake in 1960, the modern city has become one of Morocco&apos;s premier tourist destinations.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      Whether you&apos;re looking for exciting water sports on the Atlantic coast, exploring the ancient Kasbah with panoramic city views, or wandering through the bustling Souk El Had — Agadir offers something for everyone. The city is also your gateway to the stunning Paradise Valley and the vast Sahara Desert.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 rounded-lg bg-amber-50">
                          <Waves className="h-4 w-4 text-amber-600" />
                        </div>
                        <span>9km Beach</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 rounded-lg bg-orange-50">
                          <Sparkles className="h-4 w-4 text-orange-600" />
                        </div>
                        <span>300+ Sunny Days</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 rounded-lg bg-teal-50">
                          <Users className="h-4 w-4 text-teal-600" />
                        </div>
                        <span>600K+ Population</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video">
                    <img
                      src="/agadir-hero.jpg"
                      alt="Agadir City"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                </div>
              </section>

              {/* Bottom Ad */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                <DynamicAdSlot location="bottom_banner" />
              </div>
            </motion.div>
          )}

          {/* CATEGORY VIEW */}
          {view === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Category / Search Header */}
              <div className={`bg-gradient-to-r ${categoryColors[activeCategory || ''] || 'from-orange-500 to-teal-500'} text-white`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10 mb-4"
                    onClick={handleBackToHome}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Directory
                  </Button>
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/20 rounded-2xl">
                      {activeCategoryData ? getCategoryIcon(activeCategoryData.icon) : <Search className="h-8 w-8" />}
                    </div>
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-bold">
                        {activeCategoryData?.name || (searchQuery ? `Search: "${searchQuery}"` : 'All Listings')}
                      </h2>
                      <p className="text-white/80 mt-1">
                        {activeCategoryData?.description || (searchQuery ? 'Matching businesses across Agadir' : 'Browse all listings')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                      <Input
                        placeholder={activeCategoryData ? `Search in ${activeCategoryData.name}...` : 'Refine your search...'}
                        className="pl-9 bg-white/20 border-white/30 text-white placeholder:text-white/60 h-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={handleSearch}
                    >
                      <Search className="h-4 w-4 mr-1.5" />
                      Search
                    </Button>
                  </div>
                </div>
              </div>

              {/* Ad Banner */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <DynamicAdSlot location="category_banner" />
              </div>

              {/* Listings */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                  <div className="grid gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse bg-muted/50 rounded-xl h-32" />
                    ))}
                  </div>
                ) : listings.length === 0 ? (
                  <div className="text-center py-16">
                    <Search className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No listings found</h3>
                    <p className="text-muted-foreground">Try a different search term or category.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listings.map((listing, index) => (
                      <motion.div
                        key={listing.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className="cursor-pointer group hover:shadow-lg transition-all duration-300 overflow-hidden"
                          onClick={() => handleListingClick(listing)}
                        >
                          <CardContent className="p-0">
                            <div className="flex flex-col sm:flex-row">
                              {/* Thumbnail image */}
                              <div className="relative sm:w-32 h-32 sm:h-auto shrink-0 overflow-hidden">
                                <img
                                  src={getListingCardImage(listing)}
                                  alt={listing.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                              <div className="flex-1 p-4 sm:p-5">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-lg group-hover:text-orange-600 transition-colors">
                                        {listing.name}
                                      </h4>
                                      {listing.featured && (
                                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 shrink-0">
                                          <Award className="h-3 w-3 mr-1" />Featured
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{stripHtml(listing.description)}</p>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-foreground shrink-0 mt-1 group-hover:translate-x-1 transition-all hidden sm:block" />
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                  <div className="flex items-center gap-1.5">
                                    <StarRating rating={listing.rating} />
                                    <span className="font-medium">{listing.rating}</span>
                                    <span className="text-muted-foreground">({listing.reviewCount})</span>
                                  </div>
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.address + ', Agadir, Morocco')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-muted-foreground hover:text-orange-600 transition-colors group"
                                  >
                                    <MapPin className="h-3.5 w-3.5 group-hover:text-orange-600" />
                                    <span className="truncate max-w-[200px]">{listing.address}</span>
                                    <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </a>
                                  {listing.phone && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <Phone className="h-3.5 w-3.5" />
                                      <span>{listing.phone}</span>
                                    </div>
                                  )}
                                  {listing.website && (
                                    <div className="flex items-center gap-1.5 text-teal-600">
                                      <Globe className="h-3.5 w-3.5" />
                                      <span className="truncate max-w-[150px]">{listing.website}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* In-feed ad every 4 listings */}
                        {index > 0 && (index + 1) % 4 === 0 && (
                          <div className="my-4">
                            <DynamicAdSlot location="listings_feed" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* LISTING DETAIL VIEW */}
          {view === 'listing' && listingSlugLoading && !selectedListing && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center text-muted-foreground">
              Loading listing...
            </div>
          )}

          {view === 'listing' && selectedListing && (
            <motion.div
              key="listing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Listing Header */}
              <div className="relative h-56 sm:h-72 md:h-80 overflow-hidden bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getListingCardImage(selectedListing)}
                  alt={selectedListing.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-orange-600 mb-3 -ml-2"
                    onClick={handleBackToCategory}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to {selectedListing.category.name}
                  </Button>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="secondary">{selectedListing.category.name}</Badge>
                    {selectedListing.featured && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                        <Award className="h-3 w-3 mr-1" />Featured
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">{selectedListing.name}</h2>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <StarRating rating={selectedListing.rating} size="md" />
                      <span className="font-semibold ml-1">{selectedListing.rating}</span>
                    </div>
                    <span className="text-muted-foreground">({selectedListing.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Photos */}
                    <ListingPhotosGallery listing={selectedListing} />

                    {/* About */}
                    <Card className="shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-3">About</h3>
                        {isHtmlContent(selectedListing.description) ? (
                          <div
                            className="blog-content leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: selectedListing.description }}
                          />
                        ) : (
                          <p className="text-muted-foreground leading-relaxed">{selectedListing.description}</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Contact Info */}
                    <Card className="shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-orange-50 shrink-0">
                              <MapPin className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">Address</p>
                              <p className="text-muted-foreground">{selectedListing.address}</p>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedListing.address + ', Agadir, Morocco')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 text-sm font-medium hover:bg-orange-500/20 transition-colors"
                              >
                                <MapPin className="h-3.5 w-3.5" />
                                View on Google Maps
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                          {selectedListing.phone && (
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-teal-50 shrink-0">
                                <Phone className="h-5 w-5 text-teal-600" />
                              </div>
                              <div>
                                <p className="font-medium">Phone</p>
                                <a href={`tel:${selectedListing.phone}`} className="text-teal-600 hover:underline">{selectedListing.phone}</a>
                              </div>
                            </div>
                          )}
                          {selectedListing.website && (
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-blue-50 shrink-0">
                                <Globe className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">Website</p>
                                <a href={listingWebsiteHref(selectedListing.website)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                  {selectedListing.website}
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </div>
                          )}
                          {selectedListing.email && (
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-purple-50 shrink-0">
                                <Mail className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-medium">Email</p>
                                <a href={`mailto:${selectedListing.email}`} className="text-purple-600 hover:underline">{selectedListing.email}</a>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Ad in content */}
                    <DynamicAdSlot location="article_inline" className="my-4" />
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Quick Actions */}
                    <Card className="shadow-sm">
                      <CardContent className="p-5 space-y-3">
                        {selectedListing.phone && (
                          <Button className="w-full bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600" asChild>
                            <a href={`tel:${selectedListing.phone}`}>
                              <Phone className="h-4 w-4 mr-2" />
                              Call Now
                            </a>
                          </Button>
                        )}
                        {selectedListing.website && (
                          <Button variant="outline" className="w-full" asChild>
                            <a href={listingWebsiteHref(selectedListing.website)} target="_blank" rel="noopener noreferrer">
                              <Globe className="h-4 w-4 mr-2" />
                              Visit Website
                            </a>
                          </Button>
                        )}
                        {selectedListing.email && (
                          <Button variant="outline" className="w-full" asChild>
                            <a href={`mailto:${selectedListing.email}`}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>

                    {/* Sidebar Ad */}
                    <DynamicAdSlot location="sidebar_rectangle" className="min-h-[250px]" />

                    {/* Rating Card */}
                    <Card className="shadow-sm">
                      <CardContent className="p-5 text-center">
                        <div className="text-4xl font-bold mb-1">{selectedListing.rating}</div>
                        <StarRating rating={selectedListing.rating} size="md" />
                        <p className="text-sm text-muted-foreground mt-2">{selectedListing.reviewCount} reviews</p>
                        <Separator className="my-4" />
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map(star => {
                            const percentage = star === 5 ? 60 : star === 4 ? 25 : star === 3 ? 10 : star === 2 ? 3 : 2
                            return (
                              <div key={star} className="flex items-center gap-2 text-sm">
                                <span className="w-3 text-right">{star}</span>
                                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                  <div className="bg-amber-400 h-full rounded-full" style={{ width: `${percentage}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground w-8">{percentage}%</span>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* You may also like */}
                    {relatedListings.length > 0 && (
                      <Card className="shadow-sm">
                        <CardContent className="p-5">
                          <h4 className="font-semibold mb-3">You may also like</h4>
                          <div className="space-y-3">
                            {relatedListings.map((listing) => (
                              <button
                                key={listing.id}
                                type="button"
                                onClick={() => handleListingClick(listing)}
                                className="flex items-center gap-3 w-full text-left group"
                              >
                                <img
                                  src={getListingCardImage(listing)}
                                  alt={listing.name}
                                  className="h-12 w-12 rounded-lg object-cover shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate group-hover:text-orange-600 transition-colors">
                                    {listing.name}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <StarRating rating={listing.rating} />
                                    <span className="text-xs text-muted-foreground">{listing.rating}</span>
                                  </div>
                                </div>
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Related Categories */}
                    <Card className="shadow-sm">
                      <CardContent className="p-5">
                        <h4 className="font-semibold mb-3">Related Categories</h4>
                        <div className="space-y-2">
                          {categories
                            .filter(c => c.slug !== selectedListing.category.slug)
                            .slice(0, 5)
                            .map(cat => (
                              <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.slug)}
                                className="flex items-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground py-1.5 transition-colors"
                              >
                                <span>{getCategoryIcon(cat.icon)}</span>
                                <span>{cat.name}</span>
                                <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                              </button>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Separator className="mb-8" />

                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Left: Review Form */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-24">
                      <h3 className="text-xl font-bold mb-4">Write a Review</h3>

                      {reviewSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Review submitted! It will appear after admin approval.
                        </motion.div>
                      )}

                      <form onSubmit={handleReviewSubmit} className="space-y-4">
                        {reviewError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                            {reviewError}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">Your Name *</Label>
                          <Input
                            placeholder="Enter your name"
                            value={reviewForm.authorName}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, authorName: e.target.value }))}
                            className="rounded-xl"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">Your Rating *</Label>
                          <InteractiveStarSelector
                            value={reviewForm.rating}
                            onChange={(v) => setReviewForm(prev => ({ ...prev, rating: v }))}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">Your Review *</Label>
                          <Textarea
                            placeholder="Share your experience..."
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                            className="rounded-xl min-h-[100px] resize-none"
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="w-full bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white font-semibold rounded-xl"
                        >
                          {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </form>
                    </div>
                  </div>

                  {/* Right: Reviews List */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold">Reviews ({reviews.length})</h3>
                      <div className="flex items-center gap-2">
                        <StarRating rating={selectedListing.rating} size="md" />
                        <span className="font-semibold">{selectedListing.rating}</span>
                        <span className="text-sm text-muted-foreground">({selectedListing.reviewCount} reviews)</span>
                      </div>
                    </div>

                    {/* Rating Distribution Bar */}
                    <div className="bg-muted/30 rounded-xl p-4 mb-6">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = reviews.filter(r => r.rating === stars).length
                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                        return (
                          <div key={stars} className="flex items-center gap-2 mb-1 last:mb-0">
                            <span className="text-sm w-8 text-right">{stars}</span>
                            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-amber-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5, delay: 0.1 * (5 - stars) }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8">{count}</span>
                          </div>
                        )
                      })}
                    </div>

                    {reviews.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                          <Star className="h-7 w-7 text-muted-foreground/40" />
                        </div>
                        <h4 className="text-lg font-semibold mb-1">No reviews yet</h4>
                        <p className="text-muted-foreground text-sm">Be the first to share your experience!</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {reviews.map((review, index) => (
                          <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white border rounded-xl p-5 shadow-sm"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-teal-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {review.authorName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="font-semibold text-sm">{review.authorName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                                <div className="mb-2">
                                  <StarRating rating={review.rating} />
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                                {review.ownerReply && (
                                  <div className="mt-3 rounded-lg bg-orange-50 border border-orange-100 px-3 py-2">
                                    <p className="text-xs font-semibold text-orange-800 mb-1">Owner response</p>
                                    <p className="text-sm text-orange-900 leading-relaxed">{review.ownerReply}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ScrollToTop />
    </div>
  )
}
