'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="focus:outline-none transition-transform hover:scale-110"
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          aria-pressed={value === star}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= (hovered || value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export function ListingReviewForm({
  listingId,
  listingName,
}: {
  listingId: string
  listingName: string
}) {
  const [form, setForm] = useState({ authorName: '', rating: 0, comment: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.authorName || form.rating === 0 || !form.comment) {
      setError('Please fill in all fields and select a rating.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, listingId }),
      })
      if (!res.ok) throw new Error('Review submission failed')
      setForm({ authorName: '', rating: 0, comment: '' })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 5000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Write a review for {listingName}</h3>
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Review submitted! It will appear after admin approval.
        </p>
      )}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="review-author">Your Name</Label>
        <Input
          id="review-author"
          value={form.authorName}
          onChange={(e) => setForm((prev) => ({ ...prev, authorName: e.target.value }))}
          placeholder="Enter your name"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Your Rating</Label>
        <StarSelector value={form.rating} onChange={(rating) => setForm((prev) => ({ ...prev, rating }))} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="review-comment">Your Review</Label>
        <Textarea
          id="review-comment"
          value={form.comment}
          onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
          placeholder="Share your experience..."
          className="min-h-[100px]"
        />
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}
