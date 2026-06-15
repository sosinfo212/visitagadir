import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { buildBlogListUrl } from '@/lib/blog/pagination'

interface BlogPaginationProps {
  basePath: string
  page: number
  totalPages: number
  query?: Record<string, string | undefined>
}

function pageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total]
  if (current >= total - 3) return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total]
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total]
}

export function BlogPagination({ basePath, page, totalPages, query }: BlogPaginationProps) {
  if (totalPages <= 1) return null

  const href = (p: number) => buildBlogListUrl(basePath, p, query)
  const pages = pageNumbers(page, totalPages)

  return (
    <Pagination className="mt-10">
      <PaginationContent>
        {page > 1 ? (
          <PaginationItem>
            <PaginationPrevious href={href(page - 1)} />
          </PaginationItem>
        ) : (
          <PaginationItem>
            <span className="pointer-events-none opacity-40">
              <PaginationPrevious href="#" />
            </span>
          </PaginationItem>
        )}

        {pages.map((p, index) =>
          p === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink href={href(p)} isActive={p === page}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        {page < totalPages ? (
          <PaginationItem>
            <PaginationNext href={href(page + 1)} />
          </PaginationItem>
        ) : (
          <PaginationItem>
            <span className="pointer-events-none opacity-40">
              <PaginationNext href="#" />
            </span>
          </PaginationItem>
        )}
      </PaginationContent>
      <p className="text-center text-xs text-muted-foreground mt-3 w-full">
        Page {page} of {totalPages}
      </p>
    </Pagination>
  )
}
