import { NextRequest, NextResponse } from 'next/server'
import { createSession, COOKIE_NAME } from '@/lib/admin-auth'
import { verifyAdminPassword } from '@/lib/app-settings'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const valid = await verifyAdminPassword(password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = await createSession()

    const proto = request.headers.get('x-forwarded-proto') ?? 'http'
    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: proto === 'https',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
