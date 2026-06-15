import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { buildImagesArray, splitImagesForStorage } from '@/lib/listing-images'
import { getSession } from '@/lib/auth'
import { isAuthenticated } from '@/lib/admin-auth'

interface SubmissionRow {
  id: string
  businessName: string
  description: string
  category: string
  address: string
  phone: string | null
  website: string | null
  email: string | null
  ownerName: string
  message: string | null
  image: string | null
  gallery: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

function serializeSubmission(s: SubmissionRow) {
  const { gallery: _gallery, ...rest } = s
  void _gallery
  return { ...rest, images: buildImagesArray(s.image, s.gallery) }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be signed in to list a business.' }, { status: 401 })
    }

    const body = await request.json()
    const {
      businessName,
      description,
      category,
      address,
      phone,
      website,
      email,
      ownerName,
      message,
      images,
      image,
    } = body

    if (!businessName || !description || !category || !address || !ownerName) {
      return NextResponse.json(
        { error: 'Missing required fields: businessName, description, category, address, ownerName' },
        { status: 400 }
      )
    }

    // Accept the new `images[]` contract; fall back to legacy single `image`.
    const incomingImages = Array.isArray(images)
      ? images
      : (typeof image === 'string' && image ? [image] : [])
    const { image: storedImage, gallery: storedGallery } = splitImagesForStorage(incomingImages)

    const submission = await db.submission.create({
      data: {
        businessName,
        description,
        category,
        address,
        phone: phone || null,
        website: website || null,
        email: email || session.user.email || null,
        ownerName: ownerName || session.user.name || 'Business Owner',
        message: message || null,
        image: storedImage,
        gallery: storedGallery,
        status: 'pending',
        userId: session.user.id,
      },
    })

    return NextResponse.json(
      { success: true, submission: serializeSubmission(submission) },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json({ error: 'Failed to submit business' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const submissions = await db.submission.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(submissions.map(serializeSubmission))
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}
