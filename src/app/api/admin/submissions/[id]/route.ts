import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { submissionToListingPayload } from '@/lib/owner-submission-payload'

function slugFromName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authed = await isAuthenticated()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const submission = await db.submission.findUnique({ where: { id } })
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Update submission status
    const updated = await db.submission.update({
      where: { id },
      data: { status },
    })

    // If approved, publish or refresh the linked listing from submission data
    if (status === 'approved') {
      const category = await db.category.findFirst({
        where: { slug: submission.category },
      })

      if (category) {
        const existingListing = await db.listing.findFirst({
          where: { submissionId: submission.id },
        })

        const listingData = submissionToListingPayload(
          {
            businessName: submission.businessName,
            description: submission.description,
            address: submission.address,
            phone: submission.phone,
            website: submission.website,
            email: submission.email,
            image: submission.image,
            gallery: submission.gallery,
            category: submission.category,
          },
          category.id,
        )

        if (existingListing) {
          await db.listing.update({
            where: { id: existingListing.id },
            data: listingData,
          })
        } else {
          await db.listing.create({
            data: {
              name: submission.businessName,
              description: submission.description,
              address: submission.address,
              phone: submission.phone,
              website: submission.website,
              email: submission.email,
              image: submission.image,
              gallery: submission.gallery,
              categoryId: category.id,
              slug: slugFromName(submission.businessName),
              featured: false,
              userId: submission.userId,
              submissionId: submission.id,
            },
          })
        }
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update submission error:', error)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}
