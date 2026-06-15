import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email-verification'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body.email ?? '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      // Do not reveal whether the account exists
      return NextResponse.json({
        success: true,
        message: 'If an unverified account exists, a new verification email has been sent.',
      })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'This email is already verified. You can sign in.' }, { status: 400 })
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'This account uses Google sign-in. Please continue with Google.' },
        { status: 400 },
      )
    }

    const emailSent = await sendVerificationEmail(email, user.name)
    if (!emailSent) {
      return NextResponse.json(
        { error: 'Could not send verification email. Please try again later.' },
        { status: 503 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Failed to resend verification email.' }, { status: 500 })
  }
}
