import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email-verification'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await db.user.create({
      data: { name, email, passwordHash, emailVerified: null },
    })

    const emailSent = await sendVerificationEmail(email, name)
    if (!emailSent) {
      return NextResponse.json(
        {
          success: true,
          emailSent: false,
          message:
            'Account created, but we could not send the verification email. Use resend on the login page.',
        },
        { status: 201 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        emailSent: true,
        message: 'Account created. Please check your email to verify your address before signing in.',
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 })
  }
}
