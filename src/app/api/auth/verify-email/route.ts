import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailToken } from '@/lib/email-verification'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')?.trim()
  const email = searchParams.get('email')?.trim().toLowerCase()
  const callbackUrl = searchParams.get('callbackUrl') || '/my-listings'

  const loginBase = new URL('/login', request.nextUrl.origin)
  loginBase.searchParams.set('callbackUrl', callbackUrl)

  if (!token || !email) {
    loginBase.searchParams.set('verify', 'invalid')
    return NextResponse.redirect(loginBase)
  }

  const result = await verifyEmailToken(email, token)

  if (result === 'ok' || result === 'already_verified') {
    loginBase.searchParams.set('verified', '1')
    return NextResponse.redirect(loginBase)
  }

  loginBase.searchParams.set('verify', result)
  loginBase.searchParams.set('email', email)
  return NextResponse.redirect(loginBase)
}
