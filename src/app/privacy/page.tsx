'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Eye, Database, Users, Globe, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const fadeInUp = {
  initial: { y: 40, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.6 },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-gray-900" />
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-96 h-96 border border-white rounded-full" />
          <div className="absolute bottom-0 left-10 w-64 h-64 border border-white rounded-t-full" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
            <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white mx-auto mb-6">
              <Shield className="h-8 w-8" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-4xl sm:text-5xl font-extrabold text-white mb-4"
          >
            Privacy Policy
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-white/60 max-w-xl mx-auto"
          >
            Last updated: June 11, 2026
          </motion.p>
        </div>
      </section>

      {/* Key Points */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <motion.div
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { icon: Lock, title: 'Data Encryption', desc: 'All data is encrypted in transit and at rest' },
            { icon: Eye, title: 'Transparency', desc: 'We clearly explain what data we collect and why' },
            { icon: Database, title: 'Minimal Data', desc: 'We only collect what is necessary for our services' },
            { icon: Users, title: 'Your Rights', desc: 'Full control over your personal information' },
          ].map((item, i) => (
            <motion.div key={item.title} variants={fadeInUp}>
              <Card className="border-0 shadow-lg h-full">
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white flex-shrink-0">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="prose prose-slate max-w-none"
        >
          <div className="space-y-10">
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">1</span>
                Introduction
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Agadir Directory (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information when you visit our website agadirdirectory.com (the &quot;Service&quot;). Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the Service.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                By using our Service, you consent to the collection and use of information in accordance with this policy. We will not use or share your information with anyone except as described in this privacy policy. We reserve the right to update this privacy policy at any time, and changes will be effective immediately upon posting on this page. We encourage you to review this privacy policy periodically for any changes.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">2</span>
                Information We Collect
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We collect information that you provide directly to us, information collected automatically when you use our Service, and information from third-party sources. The types of information we collect include:
              </p>

              <h3 className="text-lg font-semibold mb-3">Personal Information You Provide</h3>
              <ul className="space-y-2 text-muted-foreground mb-4">
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span><strong className="text-foreground">Account Information:</strong> When you create an account or submit a business listing, we collect your name, email address, phone number, and business details including address, description, and images.</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span><strong className="text-foreground">Reviews and Feedback:</strong> When you leave a review, we collect your display name, star rating, and the text of your review.</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span><strong className="text-foreground">Communications:</strong> When you contact us via our contact form or email, we collect the information you provide in your message, including your name and email address.</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span><strong className="text-foreground">Advertising Inquiries:</strong> If you express interest in advertising, we collect your name, email, company name, and any other information you provide.</span></li>
              </ul>

              <h3 className="text-lg font-semibold mb-3">Information Collected Automatically</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span><strong className="text-foreground">Usage Data:</strong> We collect information about how you interact with our Service, including pages visited, time spent on pages, links clicked, and search queries entered.</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span><strong className="text-foreground">Device Information:</strong> We collect information about the device you use to access the Service, including device type, operating system, browser type, IP address, and screen resolution.</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span><strong className="text-foreground">Cookies and Tracking:</strong> We use cookies, web beacons, and similar technologies to collect information about your browsing activities. You can control cookies through your browser settings.</span></li>
              </ul>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">3</span>
                How We Use Your Information
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect for various purposes, including to:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Provide, operate, and maintain our directory Service, including displaying business listings and reviews</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Process business submissions and review them for quality and accuracy before publication</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Improve, personalize, and develop new features for our Service based on user behavior and feedback</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Communicate with you about your submissions, account, or inquiries, and respond to your questions</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Send you promotional communications and updates about our Service, with your consent</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Detect, prevent, and address fraud, security issues, and technical problems</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Display advertisements through Google AdSense and measure the effectiveness of advertising campaigns</span></li>
              </ul>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">4</span>
                Sharing of Your Information
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We do not sell, trade, or rent your personal identification information to others. We may share information we have collected about you in certain situations:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span><strong className="text-foreground">Public Display:</strong> Business listing information (name, address, phone, website, images, reviews) is publicly displayed on our directory. This is the core function of our Service.</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span><strong className="text-foreground">Service Providers:</strong> We may share your information with third-party service providers who perform services on our behalf, such as hosting, analytics, and advertising (including Google AdSense).</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span><strong className="text-foreground">Legal Requirements:</strong> We may disclose your information where required to do so by law or in response to valid requests by public authorities.</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span><strong className="text-foreground">Business Transfers:</strong> If we are involved in a merger, acquisition, or asset sale, your personal data may be transferred as part of that transaction.</span></li>
              </ul>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">5</span>
                Google AdSense and Advertising
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We use Google AdSense to display advertisements on our Service. Google AdSense may use cookies and web beacons to serve ads based on your prior visits to our website or other websites. Google&apos;s use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the Internet.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You may opt out of personalized advertising by visiting Google Ads Settings. Alternatively, you can opt out of a third-party vendor&apos;s use of cookies for personalized advertising by visiting aboutads.info. Please note that opting out does not mean you will no longer receive advertising, only that the advertising you receive will be less relevant to your interests.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                For more information about how Google uses data, please review Google&apos;s Privacy Policy. We do not have access to or control over the cookies that Google or other third-party advertisers use, and this privacy policy does not cover the use of cookies by third-party advertisers.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">6</span>
                Data Security
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These measures include encryption of data in transit using SSL/TLS protocols, secure storage of databases, regular security assessments, and access controls that limit who can view your personal information.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to protect your personal data, we cannot guarantee its absolute security. We encourage you to use strong passwords and to never share your login credentials with others.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">7</span>
                Your Rights and Choices
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Depending on your location, you may have the following rights regarding your personal data:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span><strong className="text-foreground">Access:</strong> You have the right to request a copy of the personal data we hold about you.</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span><strong className="text-foreground">Correction:</strong> You have the right to request that we correct any inaccurate or incomplete personal data.</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span><strong className="text-foreground">Deletion:</strong> You have the right to request that we delete your personal data, subject to certain exceptions.</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span><strong className="text-foreground">Objection:</strong> You have the right to object to our processing of your personal data for direct marketing purposes.</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span><strong className="text-foreground">Data Portability:</strong> You have the right to request your personal data in a structured, commonly used, machine-readable format.</span></li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To exercise any of these rights, please contact us at privacy@agadirdirectory.com. We will respond to your request within 30 days.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">8</span>
                Contact Us
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions or concerns about this Privacy Policy, please contact us:
              </p>
              <Card className="border shadow-none">
                <CardContent className="p-6 space-y-2 text-muted-foreground">
                  <p><strong className="text-foreground">Agadir Directory</strong></p>
                  <p>Email: privacy@agadirdirectory.com</p>
                  <p>Address: Boulevard Hassan II, Agadir 80000, Morocco</p>
                  <p>Phone: +212 528 000 000</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
