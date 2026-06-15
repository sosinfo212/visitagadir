'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, FileText, Scale, AlertTriangle, Ban, RefreshCw, Gavel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const fadeInUp = {
  initial: { y: 40, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.6 },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-slate-800 to-gray-900" />
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-80 h-80 border border-white rounded-full" />
          <div className="absolute bottom-5 right-15 w-48 h-48 border border-white rotate-45" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
            <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white mx-auto mb-6">
              <Gavel className="h-8 w-8" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-4xl sm:text-5xl font-extrabold text-white mb-4"
          >
            Terms of Service
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

      {/* Key Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <motion.div
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
          className="grid sm:grid-cols-3 gap-4"
        >
          {[
            { icon: Scale, title: 'Fair Use', desc: 'Clear guidelines for using our service responsibly' },
            { icon: AlertTriangle, title: 'User Responsibility', desc: 'You are responsible for your content and actions' },
            { icon: RefreshCw, title: 'Updates', desc: 'Terms may be updated with notice to users' },
          ].map((item, i) => (
            <motion.div key={item.title} variants={fadeInUp}>
              <Card className="border-0 shadow-lg h-full">
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-teal-500 flex items-center justify-center text-white flex-shrink-0">
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
                Acceptance of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Welcome to Agadir Directory. By accessing or using our website at agadirdirectory.com (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the Service. These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will try to provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">2</span>
                Use of Our Service
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You may use our Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service in any way that violates any applicable federal, state, local, or international law or regulation. Specifically, you agree:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Not to use the Service in any way that violates any applicable local, state, national, or international law or regulation</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Not to reproduce, duplicate, copy, sell, resell, or exploit any portion of the Service without express written permission from us</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Not to use any automated means, including bots, scrapers, or spiders, to access the Service or collect information from it</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Not to attempt to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the Service</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Not to upload, post, or transmit any viruses, Trojan horses, worms, or other malicious code through the Service</span></li>
              </ul>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">3</span>
                Business Listings and Submissions
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Our Service allows you to submit business listings for inclusion in our directory. By submitting a business listing, you represent and warrant that:
              </p>
              <ul className="space-y-2 text-muted-foreground mb-4">
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>You are the owner or authorized representative of the business being listed, or you have permission to submit the listing on behalf of the business</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>All information provided is accurate, complete, and not misleading in any way</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>The business operates legally and in compliance with all applicable laws and regulations in Morocco</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Any images uploaded are owned by you or you have the right to use them, and they do not infringe on any third-party intellectual property rights</span></li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to review, edit, or reject any listing submission at our sole discretion. Listings that contain false information, inappropriate content, or violate these Terms will not be published. We may also remove published listings that are later found to violate these Terms or that receive substantiated complaints from users.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">4</span>
                User Reviews and Content
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Our Service allows users to post reviews and ratings for listed businesses. When you post a review, you agree to the following guidelines:
              </p>
              <ul className="space-y-2 text-muted-foreground mb-4">
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Reviews must be based on genuine personal experiences with the business being reviewed</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Reviews must not contain defamatory, obscene, offensive, or threatening language</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Reviews must not contain personal information of others, such as phone numbers or addresses</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>Reviews must not be posted for the purpose of artificially inflating or deflating a business&apos;s rating</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 mt-1.5">&#8226;</span><span>You must not post reviews for your own business or a competitor&apos;s business with the intent to manipulate ratings</span></li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to remove any review that violates these guidelines, is reported as inappropriate, or is deemed to be fraudulent. Repeated violations may result in the suspension or termination of your ability to post reviews. We do not moderate reviews before they are posted, but we act promptly on reported violations.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">5</span>
                Intellectual Property
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of Agadir Directory and its licensors. The Service is protected by copyright, trademark, and other laws of both Morocco and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Agadir Directory.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                By submitting content (including business listings, reviews, and images) to the Service, you grant Agadir Directory a non-exclusive, worldwide, royalty-free, irrevocable, perpetual license to use, reproduce, modify, publish, translate, distribute, and display such content in connection with the Service. You retain all ownership rights to your content, but you grant us the right to use it as described above.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">6</span>
                Disclaimer of Warranties
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS. AGADIR DIRECTORY MAKES NO WARRANTIES, EXPRESSED OR IMPLIED, AND HEREBY DISCLAIMS AND NEGATES ALL OTHER WARRANTIES INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OR CONDITIONS OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT OF THIRD PARTIES&apos; INTELLECTUAL PROPERTY RIGHTS.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We do not guarantee the accuracy, completeness, or usefulness of any information on the Service, nor do we endorse any business listed on our directory. The information provided is for general informational purposes only, and you should independently verify any information before relying on it. We are not responsible for the quality of goods or services provided by listed businesses.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">7</span>
                Limitation of Liability
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                IN NO EVENT SHALL AGADIR DIRECTORY, NOR ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES, BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; (C) ANY CONTENT OBTAINED FROM THE SERVICE; OR (D) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This limitation of liability applies whether the alleged liability is based on contract, tort, negligence, strict liability, or any other basis, even if Agadir Directory has been advised of the possibility of such damage. In jurisdictions that do not allow the exclusion or limitation of liability for consequential or incidental damages, our liability shall be limited to the maximum extent permitted by law.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">8</span>
                Governing Law
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                These Terms shall be governed and construed in accordance with the laws of the Kingdom of Morocco, without regard to its conflict of law provisions. Any disputes arising from or relating to these Terms or the use of the Service shall be resolved through binding arbitration in Agadir, Morocco, in accordance with the applicable arbitration rules of the Moroccan courts.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Service, and supersede any prior agreements we might have had.
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">9</span>
                Contact Information
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <Card className="border shadow-none">
                <CardContent className="p-6 space-y-2 text-muted-foreground">
                  <p><strong className="text-foreground">Agadir Directory</strong></p>
                  <p>Email: legal@agadirdirectory.com</p>
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
