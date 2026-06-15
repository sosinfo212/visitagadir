/**
 * Visible breadcrumb navigation. Pair with BreadcrumbList JSON-LD
 * (`buildBreadcrumbSchema`) for the structured-data side.
 *
 * Server component — no JS shipped.
 */

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

export interface Crumb {
  name: string
  href?: string // omit on the last (current) item
}

interface Props {
  items: Crumb[]
  className?: string
}

export function BreadcrumbNav({ items, className = '' }: Props) {
  if (items.length === 0) return null
  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-sm text-muted-foreground ${className}`}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={`${c.name}-${i}`} className="flex items-center gap-1.5">
              {i === 0 && <Home className="h-3.5 w-3.5" aria-hidden />}
              {c.href && !isLast ? (
                <Link href={c.href} className="hover:text-foreground transition-colors">
                  {c.name}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'text-foreground font-medium' : ''}>
                  {c.name}
                </span>
              )}
              {!isLast && <ChevronRight className="h-3.5 w-3.5 opacity-50" aria-hidden />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
