'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CommentItem } from './CommentItem'
import { Comment } from '@/lib/api/comments'
import { commentsApi } from '@/lib/api/comments'
import { Button } from '@/components/ui/button'
import { useNotification } from '@/components/ui/notification'
import { Loader2, ChevronLeft, ChevronRight, MessageSquare, ArrowUpDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface CommentListProps {
  targetType: 'user' | 'company'
  targetId: string
}

export function CommentList({ targetType, targetId }: CommentListProps) {
  const { showError } = useNotification()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState<'createdAt' | 'upCount'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Use ref to store latest values without causing re-renders
  const paramsRef = useRef({ targetType, targetId, page, sortBy, sortOrder })
  paramsRef.current = { targetType, targetId, page, sortBy, sortOrder }

  const loadComments = useCallback(async () => {
    setIsLoading(true)
    try {
      const { targetType, targetId, page, sortBy, sortOrder } = paramsRef.current
      const result = await commentsApi.getComments({
        targetType,
        targetId,
        page,
        limit: 10,
        sortBy,
        sortOrder,
      })
      setComments(result.comments)
      setTotalPages(result.pagination.totalPages)
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể tải bình luận')
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  // Only re-fetch when key params change - don't include loadComments in deps
  useEffect(() => {
    loadComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId, page, sortBy, sortOrder]) // Removed loadComments from deps

  const handleCommentCreated = () => {
    setPage(1)
    loadComments()
  }

  const handleCommentDeleted = () => {
    loadComments()
  }

  const handleCommentUpdated = () => {
    loadComments()
  }

  if (isLoading && comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Đang tải bình luận...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">
            Bình luận
            {comments.length > 0 && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({comments.length})
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select
            value={sortBy}
            onValueChange={(value) => {
              setSortBy(value as 'createdAt' | 'upCount')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Mới nhất</SelectItem>
              <SelectItem value="upCount">Hữu ích nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <div className="rounded-full bg-muted p-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">Chưa có bình luận nào</p>
            <p className="text-sm text-muted-foreground mt-1">
              Hãy là người đầu tiên chia sẻ đánh giá
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <div key={comment._id}>
                <CommentItem
                  comment={comment}
                  onCommentDeleted={handleCommentDeleted}
                  onCommentUpdated={handleCommentUpdated}
                />
                {index < comments.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <div className="flex items-center gap-2 px-4">
                <span className="text-sm font-medium">
                  Trang <span className="text-primary">{page}</span> / {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
                className="gap-2"
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export { CommentForm } from './CommentForm'

