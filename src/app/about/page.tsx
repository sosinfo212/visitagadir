'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  MapPin, Users, Award, Globe, Heart, Target, Eye, Sparkles,
  ArrowLeft, ChevronRight, Star, Building2, Search, TrendingUp, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const fadeInUp = {
  initial: { y: 40, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.6 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-teal-600" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 border-2 border-white rounded-full" />
          <div className="absolute bottom-10 right-10 w-96 h-96 border border-white rounded-t-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/50 rounded-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white text-sm mb-6 backdrop-blur-sm border border-white/20">
              <MapPin className="h-3.5 w-3.5" />
              Agadir, Morocco
            </span>
          </motion.div>
          <motion.h1
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight"
          >
            About <span className="bg-gradient-to-r from-amber-200 to-yellow-100 bg-clip-text text-transparent">Agadir Directory</span>
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto"
          >
            We are the most comprehensive online guide to Agadir, connecting locals and visitors with the best businesses, services, and experiences the city has to offer.
          </motion.p>
        </div>
      </section>

      {/* Our Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeInUp}>
            <span className="text-orange-500 font-semibold text-sm uppercase tracking-wider">Our Story</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-6">Built by People Who Love Agadir</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Agadir Directory was born from a simple observation: there was no single, reliable, and beautifully designed online resource that captured the full breadth of what Agadir has to offer. As residents and frequent visitors to this stunning coastal city, we found ourselves constantly recommending restaurants, hotels, surf schools, and hidden gems to friends and travelers, only to realize that this knowledge deserved a proper home.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Founded in 2024, Agadir Directory set out to create more than just a business listing. We wanted to build a living, breathing guide that evolves with the city itself. Every listing is carefully reviewed, every category thoughtfully organized, and every feature designed to make discovering Agadir as enjoyable as visiting the city. From the bustling stalls of Souk El Had to the tranquil luxury of beachfront resorts, we cover it all.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Today, our directory features hundreds of verified businesses across 12 categories, and we continue to grow every day. Whether you are a local looking for a new restaurant, a tourist planning your dream vacation, or a business owner seeking visibility, Agadir Directory is your trusted companion.
            </p>
          </motion.div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src="/listings/beaches-water-sports.jpg" alt="Agadir coastline" className="w-full h-80 object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-teal-500 flex items-center justify-center text-white">
                <Heart className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-lg">500+</p>
                <p className="text-sm text-muted-foreground">Happy Users Daily</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-muted/30 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="initial" animate="animate" variants={stagger} className="grid md:grid-cols-2 gap-8">
            <motion.div variants={fadeInUp}>
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white mb-6">
                    <Target className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Our mission is to be the definitive digital gateway to Agadir, empowering both residents and visitors with comprehensive, accurate, and up-to-date information about every business and service in the city. We believe that a great city deserves a great directory, one that is accessible to everyone, easy to navigate, and genuinely useful.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We are committed to supporting local businesses by giving them a platform to showcase their offerings to a wider audience. By connecting consumers with the right businesses, we help foster economic growth and community engagement throughout the Agadir region.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white mb-6">
                    <Eye className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We envision Agadir Directory as the go-to platform that every resident and tourist thinks of first when they need to find a business, service, or experience in Agadir. Our goal is to become the digital heartbeat of the city, a platform that not only lists businesses but also tells the stories behind them and helps build lasting connections.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    As we look to the future, we plan to expand our coverage to include the entire Souss-Massa region, integrate real-time booking capabilities, and develop mobile applications that make the directory even more accessible on the go. We are building the infrastructure for Agadir&apos;s digital future.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <motion.div initial="initial" animate="animate" variants={stagger} className="text-center mb-12">
          <motion.span variants={fadeInUp} className="text-orange-500 font-semibold text-sm uppercase tracking-wider">By the Numbers</motion.span>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mt-2">Agadir Directory Impact</motion.h2>
        </motion.div>
        <motion.div initial="initial" animate="animate" variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Building2, value: '31+', label: 'Listed Businesses', color: 'from-orange-500 to-red-500' },
            { icon: Users, value: '5,000+', label: 'Monthly Visitors', color: 'from-teal-500 to-cyan-500' },
            { icon: Star, value: '4.5', label: 'Average Rating', color: 'from-amber-500 to-yellow-500' },
            { icon: Globe, value: '12', label: 'Categories', color: 'from-purple-500 to-indigo-500' },
          ].map((stat, i) => (
            <motion.div key={stat.label} variants={fadeInUp}>
              <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mx-auto mb-4`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="initial" animate="animate" variants={stagger} className="text-center mb-12">
            <motion.span variants={fadeInUp} className="text-orange-500 font-semibold text-sm uppercase tracking-wider">What We Stand For</motion.span>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mt-2">Our Core Values</motion.h2>
          </motion.div>
          <motion.div initial="initial" animate="animate" variants={stagger} className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Trust & Accuracy',
                description: 'Every listing on our platform undergoes a thorough review process to ensure the information is accurate and up-to-date. We verify business details, monitor reviews for authenticity, and promptly address any reported inaccuracies. Our users trust us because we earn that trust every single day through consistent quality and transparency.',
                color: 'from-blue-500 to-indigo-500',
              },
              {
                icon: Sparkles,
                title: 'User Experience First',
                description: 'We believe that finding a business should be effortless and even enjoyable. Our interface is designed with simplicity and elegance at its core, featuring intuitive search, clear categories, and helpful filters. Every pixel on our platform serves a purpose: to help you find what you need faster and with less friction.',
                color: 'from-orange-500 to-amber-500',
              },
              {
                icon: TrendingUp,
                title: 'Community Growth',
                description: 'We are deeply invested in the growth and prosperity of Agadir. By giving local businesses a powerful online presence, we help them reach new customers and thrive in an increasingly digital world. Our directory does not just list businesses; it amplifies the entire local economy and helps the community flourish together.',
                color: 'from-teal-500 to-emerald-500',
              },
            ].map((value, i) => (
              <motion.div key={value.title} variants={fadeInUp}>
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center text-white mb-6`}>
                      <value.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <motion.div initial="initial" animate="animate" variants={stagger} className="text-center mb-12">
          <motion.span variants={fadeInUp} className="text-orange-500 font-semibold text-sm uppercase tracking-wider">The People Behind It</motion.span>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mt-2">Our Team</motion.h2>
        </motion.div>
        <motion.div initial="initial" animate="animate" variants={stagger} className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: 'Youssef El Amrani',
              role: 'Founder & CEO',
              bio: 'Born and raised in Agadir, Youssef has over 15 years of experience in digital marketing and technology. His passion for his hometown and its business community led him to create Agadir Directory as a way to give back and support local entrepreneurship.',
              initial: 'Y',
              color: 'from-orange-500 to-red-500',
            },
            {
              name: 'Fatima Zahra Benali',
              role: 'Head of Content',
              bio: 'With a background in journalism and travel writing, Fatima ensures that every listing tells a compelling story. She leads the team responsible for verifying business information, writing descriptions, and maintaining the high editorial standards that set Agadir Directory apart.',
              initial: 'F',
              color: 'from-teal-500 to-cyan-500',
            },
            {
              name: 'Karim Tazi',
              role: 'Lead Developer',
              bio: 'A full-stack developer with a keen eye for design, Karim is the technical architect behind Agadir Directory. He brings expertise in modern web technologies and a deep commitment to creating fast, accessible, and beautiful digital experiences for all users.',
              initial: 'K',
              color: 'from-purple-500 to-indigo-500',
            },
          ].map((member, i) => (
            <motion.div key={member.name} variants={fadeInUp}>
              <Card className="text-center h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white text-xl font-bold mx-auto mb-4`}>
                    {member.initial}
                  </div>
                  <h3 className="text-lg font-bold">{member.name}</h3>
                  <p className="text-orange-500 text-sm font-medium mb-3">{member.role}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{member.bio}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-20 sm:py-24">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/listings/beaches-water-sports.jpg')" }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/85 via-orange-700/80 to-teal-700/85" />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.h2
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
          >
            Ready to Explore Agadir?
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-white/90 text-lg mb-8 max-w-xl mx-auto"
          >
            Discover the best restaurants, hotels, beaches, and services Agadir has to offer.
          </motion.p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/">
              <Button size="lg" className="h-12 px-8 bg-white text-orange-600 hover:bg-white/90 font-semibold rounded-xl shadow-xl">
                <Search className="h-4 w-4 mr-2" />
                Explore Directory
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                className="h-12 px-8 bg-white/15 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-orange-600 font-semibold rounded-xl shadow-lg transition-all duration-300"
              >
                Get in Touch
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
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
