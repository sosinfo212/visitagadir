'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft, ChevronRight, Star, Zap, Crown, CheckCircle2,
  TrendingUp, Eye, Target, BarChart3, Users, Phone, Mail, Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const fadeInUp = {
  initial: { y: 40, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.6 },
}

export default function AdvertisePage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSuccess(true)
    setIsSubmitting(false)
    setForm({ name: '', email: '', company: '', message: '' })
    setTimeout(() => setIsSuccess(false), 4000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-teal-500" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-60 h-60 border-2 border-white rotate-45" />
          <div className="absolute bottom-10 right-20 w-80 h-80 border border-white rounded-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
            <Badge className="bg-white/15 text-white border-white/25 px-4 py-1.5 text-sm mb-6 backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Grow Your Business
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6"
          >
            Advertise with <span className="bg-gradient-to-r from-amber-200 to-yellow-100 bg-clip-text text-transparent">Agadir Directory</span>
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto"
          >
            Reach thousands of potential customers actively searching for businesses in Agadir. Our advertising solutions deliver real results for businesses of all sizes.
          </motion.p>
        </div>
      </section>

      {/* Why Advertise */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} className="text-center mb-12">
          <motion.span variants={fadeInUp} className="text-orange-500 font-semibold text-sm uppercase tracking-wider">Why Choose Us</motion.span>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mt-2">Reach Your Target Audience</motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Agadir Directory attracts thousands of visitors every month who are actively looking for businesses, services, and experiences in Agadir. Our platform puts your brand in front of the right people at the right time.
          </motion.p>
        </motion.div>
        <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Eye, value: '5,000+', label: 'Monthly Visitors', description: 'High-intent users actively searching for local businesses and services in the Agadir region.' },
            { icon: Target, value: '90%', label: 'Local Reach', description: 'Our audience is specifically interested in Agadir, ensuring your ads reach the most relevant demographic.' },
            { icon: TrendingUp, value: '3.2x', label: 'Avg ROI', description: 'Businesses advertising with us see an average return of 3.2 times their investment within the first quarter.' },
            { icon: BarChart3, value: '24/7', label: 'Visibility', description: 'Your business is visible around the clock, long after traditional advertising channels have gone dark.' },
          ].map((stat, i) => (
            <motion.div key={stat.label} variants={fadeInUp}>
              <Card className="text-center h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white mx-auto mb-4">
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="font-semibold mt-1">{stat.label}</p>
                  <p className="text-sm text-muted-foreground mt-2">{stat.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Pricing Plans */}
      <section className="bg-muted/30 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} className="text-center mb-12">
            <motion.span variants={fadeInUp} className="text-orange-500 font-semibold text-sm uppercase tracking-wider">Pricing Plans</motion.span>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mt-2">Choose the Right Plan for You</motion.h2>
          </motion.div>
          <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.15 } } }} className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Basic',
                icon: Star,
                price: 'Free',
                period: '',
                description: 'Perfect for getting started with a basic online presence on Agadir Directory.',
                features: [
                  'Standard business listing',
                  'Business name and description',
                  'Contact information display',
                  'Category placement',
                  'Customer reviews',
                ],
                cta: 'Get Started',
                popular: false,
                color: 'from-slate-500 to-gray-600',
              },
              {
                name: 'Featured',
                icon: Zap,
                price: '499 MAD',
                period: '/month',
                description: 'Boost your visibility and stand out from competitors with premium placement.',
                features: [
                  'Everything in Basic',
                  'Featured badge on listing',
                  'Top placement in category',
                  'Homepage featured section',
                  'Business image gallery',
                  'Priority in search results',
                  'Analytics dashboard',
                ],
                cta: 'Start Free Trial',
                popular: true,
                color: 'from-orange-500 to-teal-500',
              },
              {
                name: 'Premium',
                icon: Crown,
                price: '999 MAD',
                period: '/month',
                description: 'Maximum exposure with exclusive advertising placements and dedicated support.',
                features: [
                  'Everything in Featured',
                  'Banner ad placement',
                  'Sidebar advertisement',
                  'Newsletter feature',
                  'Social media promotion',
                  'Dedicated account manager',
                  'Custom landing page',
                  'Monthly performance reports',
                ],
                cta: 'Contact Sales',
                popular: false,
                color: 'from-purple-500 to-indigo-500',
              },
            ].map((plan, i) => (
              <motion.div key={plan.name} variants={fadeInUp}>
                <Card className={`h-full border-0 shadow-lg hover:shadow-xl transition-shadow relative ${plan.popular ? 'ring-2 ring-orange-500' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-orange-500 to-teal-500 text-white border-0 px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-8">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white mb-4`}>
                      <plan.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-teal-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full rounded-xl font-semibold ${
                        plan.popular
                          ? 'bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {plan.cta}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Ad Formats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} className="text-center mb-12">
          <motion.span variants={fadeInUp} className="text-orange-500 font-semibold text-sm uppercase tracking-wider">Ad Formats</motion.span>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mt-2">Advertising Options</motion.h2>
        </motion.div>
        <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Banner Ads',
              description: 'Eye-catching banner advertisements placed strategically throughout the directory. Available in multiple sizes including leaderboard (728x90), medium rectangle (300x250), and wide skyscraper (160x600) formats. Perfect for building brand awareness and driving traffic to your website or landing page.',
              placement: 'Homepage, Category Pages, Listing Details',
              color: 'from-orange-500 to-red-500',
            },
            {
              title: 'Featured Listings',
              description: 'Elevate your business listing to the top of search results and category pages with a featured badge. Featured listings receive significantly more views and click-throughs than standard listings, making them the most cost-effective way to attract new customers actively searching for your services.',
              placement: 'Search Results, Category Pages, Homepage',
              color: 'from-teal-500 to-cyan-500',
            },
            {
              title: 'Sponsored Content',
              description: 'Promote your business through sponsored articles, guides, and newsletters that reach our engaged audience. Our content team can help craft compelling stories that highlight your unique value proposition while providing genuine value to our readers.',
              placement: 'Blog, Email Newsletter, Social Media',
              color: 'from-purple-500 to-indigo-500',
            },
          ].map((format, i) => (
            <motion.div key={format.title} variants={fadeInUp}>
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${format.color} flex items-center justify-center text-white mb-6`}>
                    <BarChart3 className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{format.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">{format.description}</p>
                  <div className="bg-muted/50 rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground"><span className="font-medium">Placements:</span> {format.placement}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Contact Form */}
      <section className="bg-muted/30 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold">Ready to Advertise?</h2>
                  <p className="text-muted-foreground mt-2">Fill out the form below and our advertising team will contact you within 24 hours to discuss the best options for your business.</p>
                </div>

                {isSuccess && (
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6"
                  >
                    Thank you for your interest! Our advertising team will reach out to you shortly.
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Full Name <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder="Your name"
                        value={form.name}
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Email <span className="text-red-500">*</span></Label>
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        value={form.email}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Company / Business Name</Label>
                    <Input
                      placeholder="Your business name"
                      value={form.company}
                      onChange={(e) => setForm(prev => ({ ...prev, company: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Message</Label>
                    <Textarea
                      placeholder="Tell us about your advertising goals..."
                      value={form.message}
                      onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                      className="rounded-xl min-h-[100px] resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold rounded-xl text-base"
                  >
                    {isSubmitting ? 'Sending...' : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Request Advertising Info
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/agadir-logo.png" alt="Agadir Directory" className="h-8 w-8 rounded-lg" />
                <span className="font-bold text-lg">Agadir Directory</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your complete guide to discovering the best of Agadir, Morocco.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Pages</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/advertise" className="hover:text-white transition-colors">Advertise</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>info@agadirdirectory.com</li>
                <li>+212 528 000 000</li>
                <li>Agadir, Morocco</li>
              </ul>
            </div>
          </div>
          <Separator className="my-8 bg-gray-800" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Agadir Directory. All rights reserved.</p>
            <p>Made with Heart in Agadir, Morocco</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
