import Image, { type ImageProps } from 'next/image'

const LOCAL_HOSTS = new Set(['www.visitagadir.info', 'visitagadir.info', 'localhost', '127.0.0.1'])

/** Same-origin and /public paths can use the Next.js image optimizer. */
export function isLocalImageSrc(src: string): boolean {
  if (!src) return false
  if (src.startsWith('/')) return true
  try {
    const url = new URL(src)
    return LOCAL_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

type OptimizedImageProps = Omit<ImageProps, 'src'> & {
  src: string
}

/** next/image wrapper — optimizes local uploads; remote URLs stay unoptimized to avoid config churn. */
export function OptimizedImage({ src, alt, unoptimized, ...props }: OptimizedImageProps) {
  const useUnoptimized = unoptimized ?? !isLocalImageSrc(src)
  return <Image src={src} alt={alt} unoptimized={useUnoptimized} {...props} />
}
