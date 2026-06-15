'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Building2, CheckCircle2, Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiImageInput } from '@/components/multi-image-input'

export interface CategoryWithCount {
  id: string
  name: string
  slug: string
  icon: string
  description: string
  listingCount: number
}

interface AddBusinessForm {
  businessName: string
  description: string
  category: string
  address: string
  phone: string
  website: string
  email: string
  ownerName: string
  message: string
  images: string[]
}

const EMPTY_BUSINESS_FORM: AddBusinessForm = {
  businessName: '',
  description: '',
  category: '',
  address: '',
  phone: '',
  website: '',
  email: '',
  ownerName: '',
  message: '',
  images: [],
}

export function AddBusinessModal({
  categories,
  open,
  onOpenChange,
  userName,
  userEmail,
}: {
  categories: CategoryWithCount[]
  open: boolean
  onOpenChange: (open: boolean) => void
  userName?: string | null
  userEmail?: string | null
}) {
  const [form, setForm] = useState<AddBusinessForm>(EMPTY_BUSINESS_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm((prev) => ({
        ...prev,
        ownerName: prev.ownerName || userName || '',
        email: prev.email || userEmail || '',
      }))
    }
  }, [open, userName, userEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.businessName || !form.description || !form.category || !form.address || !form.ownerName) {
      setError('Please fill in all required fields.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: form.businessName,
          description: form.description,
          category: form.category,
          address: form.address,
          phone: form.phone,
          website: form.website,
          email: form.email,
          ownerName: form.ownerName,
          message: form.message,
          images: form.images,
        }),
      })
      if (!res.ok) {
        let detail = 'Submission failed'
        try {
          const data = await res.json()
          if (data?.error) detail = data.error
        } catch {
          /* ignore */
        }
        if (res.status === 401) {
          window.location.href = '/login?callbackUrl=/?listBusiness=1'
          return
        }
        throw new Error(detail)
      }
      setIsSuccess(true)
      setTimeout(() => {
        setForm(EMPTY_BUSINESS_FORM)
        setIsSuccess(false)
        onOpenChange(false)
      }, 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = <K extends keyof AddBusinessForm>(field: K, value: AddBusinessForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto p-0">
        {isSuccess ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-10 text-center space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
            >
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </motion.div>
            <h3 className="text-xl font-bold">Submission Received!</h3>
            <p className="text-muted-foreground">
              Your business is now on your My Listings page with a <strong>Pending</strong> status.
              You can edit or delete it anytime while we review.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/my-listings">View My Listings</Link>
            </Button>
          </motion.div>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-0">
              <DialogTitle className="text-xl flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-teal-500 text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                List Your Business
              </DialogTitle>
              <DialogDescription>
                Add your business to Agadir Directory and reach thousands of potential customers.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="businessName" className="text-sm font-medium">
                  Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="businessName"
                  placeholder="e.g. Le Jardin d'Eau"
                  value={form.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Business Photos</Label>
                <p className="text-xs text-muted-foreground/80">
                  The first photo becomes your featured image. Add more to build the gallery.
                </p>
                <MultiImageInput
                  value={form.images}
                  onChange={(next) => updateField('images', next)}
                  maxImages={8}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select value={form.category} onValueChange={(v) => updateField('category', v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ownerName" className="text-sm font-medium">
                    Your Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ownerName"
                    placeholder="Your full name"
                    value={form.ownerName}
                    onChange={(e) => updateField('ownerName', e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your business, services, and what makes it special..."
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="rounded-xl min-h-[80px] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-sm font-medium">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="e.g. Boulevard Hassan II, Agadir 80000"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+212 528 xxx xxx"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@yourbusiness.ma"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-sm font-medium">
                  Website
                </Label>
                <Input
                  id="website"
                  placeholder="www.yourbusiness.ma"
                  value={form.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-sm font-medium">
                  Additional Message
                </Label>
                <Textarea
                  id="message"
                  placeholder="Any additional information you'd like us to know..."
                  value={form.message}
                  onChange={(e) => updateField('message', e.target.value)}
                  className="rounded-xl min-h-[60px] resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white font-semibold rounded-xl text-base"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Submit for Review
                  </span>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Your listing will be reviewed within 24-48 hours before being published.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
