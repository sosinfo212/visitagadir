import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import MyListingsClient from './my-listings-client'

export default async function MyListingsPage() {
  const session = await getSession()
  if (!session?.user) {
    redirect('/login?callbackUrl=/my-listings')
  }

  return <MyListingsClient userName={session.user.name} userEmail={session.user.email} />
}
