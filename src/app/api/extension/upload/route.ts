import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { isExtensionAuthorized } from '@/lib/extension-auth'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const MAX_BYTES = 8 * 1024 * 1024

export async function POST(request: NextRequest) {
  if (!isExtensionAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 400 })
    }

    const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
    const hash = crypto.createHash('sha1').update(`${Date.now()}-${file.name}`).digest('hex').slice(0, 10)
    const filename = `${hash}-place.${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'listings', 'imported')

    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))

    return NextResponse.json({ url: `/uploads/listings/imported/${filename}` })
  } catch (error) {
    console.error('Extension upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
