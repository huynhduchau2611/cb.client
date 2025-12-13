'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Comment } from '@/lib/api/comments'
import { commentsApi } from '@/lib/api/comments'
import { useNotification } from '@/components/ui/notification'
import { useAuth } from '@/lib/auth-context'
import { ThumbsUp, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface CommentItemProps {
  comment: Comment
  onCommentDeleted?: () => void
  onCommentUpdated?: () => void
}

export function CommentItem({ comment, onCommentDeleted, onCommentUpdated }: CommentItemProps) {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [isUpvoting, setIsUpvoting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [localComment, setLocalComment] = useState(comment)

  const userInfo = typeof localComment.user === 'object' ? localComment.user : null
  const userName = userInfo?.fullName || 'Người dùng ẩn danh'
  const userAvatar = userInfo?.avatar
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const userId = user?._id || user?.id || ''
  const isUpvoted = user && userId && localComment.upvotedBy.includes(userId)
  const isOwner = user && userId && userInfo?._id && userId === userInfo._id
  const isAdmin = user?.role === 'admin'

  const handleUpvote = async () => {
    if (!user) {
      showError('Lỗi', 'Vui lòng đăng nhập để vote')
      return
    }

    setIsUpvoting(true)
    try {
      const result = await commentsApi.upvoteComment(localComment._id)
      setLocalComment(result.comment)
      onCommentUpdated?.()
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể vote')
    } finally {
      setIsUpvoting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return
    }

    setIsDeleting(true)
    try {
      await commentsApi.deleteComment(localComment._id)
      showSuccess('Thành công', 'Đã xóa bình luận')
      onCommentDeleted?.()
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể xóa bình luận')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="group relative">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Link href={userInfo?._id ? `/users/${userInfo._id}` : '#'} className="shrink-0">
          <Avatar className="size-12 hover:ring-2 hover:ring-primary transition-all cursor-pointer border-2 border-background shadow-sm">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {userInfo?._id ? (
                <Link 
                  href={`/users/${userInfo._id}`}
                  className="font-semibold text-base hover:text-primary transition-colors inline-block"
                >
                  {userName}
                </Link>
              ) : (
                <div className="font-semibold text-base">{userName}</div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(localComment.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                </div>
              </div>
            </div>
            {(isOwner || isAdmin) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Pros and Cons */}
          <div className="space-y-4">
            {/* Pros */}
            <div className="rounded-lg border border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Ưu điểm
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {localComment.pros}
              </p>
            </div>

            {/* Cons */}
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-1">
                  <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Nhược điểm
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {localComment.cons}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant={isUpvoted ? "default" : "outline"}
              size="sm"
              onClick={handleUpvote}
              disabled={isUpvoting || !user}
              className={`gap-2 ${isUpvoted ? 'bg-primary text-primary-foreground' : ''}`}
            >
              <ThumbsUp
                className={`h-4 w-4 ${isUpvoted ? 'fill-current' : ''}`}
              />
              <span className="text-sm font-medium">
                Hữu ích
                {localComment.upCount > 0 && (
                  <span className="ml-1">({localComment.upCount})</span>
                )}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

