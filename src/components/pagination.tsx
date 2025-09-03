import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
  className?: string
}

export default function Pagination({ currentPage, totalPages, basePath, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageUrl = (page: number) => {
    if (page === 1) return basePath
    return `${basePath}?page=${page}`
  }

  const renderPageNumbers = () => {
    const pages = []
    const showPages = 5 // 显示的页码数量
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2))
    const endPage = Math.min(totalPages, startPage + showPages - 1)

    // 调整起始页
    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1)
    }

    // 如果不是从第一页开始，显示第一页和省略号
    if (startPage > 1) {
      pages.push(
        <Link
          key={1}
          href={getPageUrl(1)}
          className="px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
        >
          1
        </Link>
      )
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="px-3 py-2 text-sm text-muted-foreground">
            ...
          </span>
        )
      }
    }

    // 显示页码范围
    for (let page = startPage; page <= endPage; page++) {
      pages.push(
        <Link
          key={page}
          href={getPageUrl(page)}
          className={cn(
            "px-3 py-2 text-sm border rounded-md transition-colors",
            page === currentPage
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent"
          )}
        >
          {page}
        </Link>
      )
    }

    // 如果不是到最后一页，显示省略号和最后一页
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="px-3 py-2 text-sm text-muted-foreground">
            ...
          </span>
        )
      }
      pages.push(
        <Link
          key={totalPages}
          href={getPageUrl(totalPages)}
          className="px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
        >
          {totalPages}
        </Link>
      )
    }

    return pages
  }

  return (
    <nav className={cn("flex items-center justify-center gap-2", className)} aria-label="Pagination">
      {/* 上一页按钮 */}
      {currentPage > 1 ? (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 px-3 py-2 text-sm border rounded-md text-muted-foreground cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
          Previous
        </span>
      )}

      {/* 页码 */}
      <div className="flex items-center gap-1">
        {renderPageNumbers()}
      </div>

      {/* 下一页按钮 */}
      {currentPage < totalPages ? (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 px-3 py-2 text-sm border rounded-md text-muted-foreground cursor-not-allowed">
          Next
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  )
}
