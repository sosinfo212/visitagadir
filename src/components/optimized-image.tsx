import Image, { type ImageProps } from 'next/image'

const LOCAL_HOSTS = new Set(['www.visitagadir.info', 'visitagadir.info', 'localhost', '127.0.0.1'])

/**
 * User uploads are served (and cached 30d) directly by Nginx from disk.
 * Routing them through the Next.js optimizer (`/_next/image` → sharp) burns
 * CPU on the single Node process and isn't cached by Nginx, so keep them raw.
 */
export function isOptimizerBypass(src: string): boolean {
  return src.startsWith('/uploads/')
}

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
  const useUnoptimized = unoptimized ?? (isOptimizerBypass(src) || !isLocalImageSrc(src))
  return <Image src={src} alt={alt} unoptimized={useUnoptimized} {...props} />
}
