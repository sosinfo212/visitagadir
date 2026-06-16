import path from 'path'

/** Persistent upload root. On VPS set UPLOAD_ROOT=/var/www/visitagadir/public/uploads */
export function getUploadsRoot(): string {
  if (process.env.UPLOAD_ROOT) {
    return process.env.UPLOAD_ROOT
  }
  return path.join(process.cwd(), 'public', 'uploads')
}

export function resolveUploadDir(...segments: string[]): string {
  return path.join(getUploadsRoot(), ...segments)
}

export function uploadPublicUrl(...segments: string[]): string {
  return `/uploads/${segments.join('/')}`.replace(/\/+/g, '/')
}
