import { NextRequest, NextResponse } from 'next/server'
import { getAppSettings } from '@/lib/app-settings'
import { sendContactFormNotification } from '@/lib/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
    const message = typeof body.message === 'string' ? body.message.trim() : ''

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
    }

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    if (!message || message.length < 5) {
      return NextResponse.json({ error: 'Please enter a message (at least 5 characters).' }, { status: 400 })
    }

    const settings = await getAppSettings()
    const adminEmail =
      settings.adminEmail?.trim() ||
      process.env.SMTP_FROM?.trim() ||
      process.env.SMTP_USER?.trim() ||
      ''

    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Contact form is not configured. Please set an admin email in site settings.' },
        { status: 503 },
      )
    }

    const sent = await sendContactFormNotification({
      adminEmail,
      name,
      email,
      subject: subject || undefined,
      message,
    })

    if (!sent) {
      return NextResponse.json(
        { error: 'Unable to send your message right now. Please try again later or email us directly.' },
        { status: 503 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
  }
}
