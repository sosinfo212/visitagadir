import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          select: { provider: true },
        },
        _count: {
          select: {
            submissions: true,
            listings: true,
          },
        },
      },
    })

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        providers: u.accounts.map((a) => a.provider),
        hasPassword: !!u.passwordHash,
        submissionCount: u._count.submissions,
        listingCount: u._count.listings,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
    )
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
