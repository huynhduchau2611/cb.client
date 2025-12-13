"use client"

import { Button } from "@/components/ui/button"
import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PaginationProps {
  /** Current page number (1-based) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Total number of items (optional, for info display) */
  totalItems?: number
  /** Items per page (optional, for info display) */
  itemsPerPage?: number
  /** Show info text like "Hiển thị X / Y items" */
  showInfo?: boolean
  /** Variant: "simple" (prev/next only) or "full" (with page numbers) */
  variant?: "simple" | "full"
  /** Maximum number of page buttons to show (only for full variant) */
  maxVisiblePages?: number
  /** Disable pagination */
  disabled?: boolean
  /** Custom className */
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  showInfo = false,
  variant = "simple",
  maxVisiblePages = 5,
  disabled = false,
  className,
}: PaginationProps) {
  // Don't render if only one page
  if (totalPages <= 1 && !showInfo) {
    return null
  }

  const hasPrevPage = currentPage > 1
  const hasNextPage = currentPage < totalPages

  // Calculate visible page numbers for full variant
  const getVisiblePages = () => {
    if (variant !== "full" || totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | "ellipsis")[] = []
    const half = Math.floor(maxVisiblePages / 2)

    if (currentPage <= half + 1) {
      // Show first pages
      for (let i = 1; i <= maxVisiblePages - 1; i++) {
        pages.push(i)
      }
      pages.push("ellipsis")
      pages.push(totalPages)
    } else if (currentPage >= totalPages - half) {
      // Show last pages
      pages.push(1)
      pages.push("ellipsis")
      for (let i = totalPages - (maxVisiblePages - 2); i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show middle pages
      pages.push(1)
      pages.push("ellipsis")
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i)
      }
      pages.push("ellipsis")
      pages.push(totalPages)
    }

    return pages
  }

  const visiblePages = variant === "full" ? getVisiblePages() : []

  // Calculate info text
  const getInfoText = () => {
    if (!showInfo || totalItems === undefined) return null

    if (totalItems === 0) {
      return "Không có mục nào"
    }

    const start = (currentPage - 1) * (itemsPerPage || 10) + 1
    const end = Math.min(currentPage * (itemsPerPage || 10), totalItems)

    if (start === end) {
      return `Hiển thị ${start} / ${totalItems} mục`
    }

    return `Hiển thị ${start}-${end} / ${totalItems} mục`
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <PaginationRoot>
          <PaginationContent>
            {/* Previous Button */}
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!hasPrevPage || disabled}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Trước</span>
              </Button>
            </PaginationItem>

            {/* Page Numbers (Full Variant) */}
            {variant === "full" &&
              visiblePages.map((page, index) => {
                if (page === "ellipsis") {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                }

                return (
                  <PaginationItem key={page}>
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(page)}
                      disabled={disabled}
                      className="min-w-[2.5rem]"
                    >
                      {page}
                    </Button>
                  </PaginationItem>
                )
              })}

            {/* Simple Variant: Show current page info */}
            {variant === "simple" && (
              <PaginationItem>
                <span className="flex items-center px-3 text-sm text-gray-600 whitespace-nowrap">
                  Trang {currentPage} / {totalPages}
                </span>
              </PaginationItem>
            )}

            {/* Next Button */}
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNextPage || disabled}
                className="gap-1"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </PaginationRoot>
      )}

      {/* Info Text */}
      {showInfo && (
        <div className="text-center text-sm text-gray-600">
          {getInfoText() || (
            <span>
              Hiển thị {totalItems || 0} {totalItems === 1 ? "mục" : "mục"}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

