'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field'
import { commentsApi, CreateCommentData } from '@/lib/api/comments'
import { useNotification } from '@/components/ui/notification'
import { useAuth } from '@/lib/auth-context'
import { Loader2, MessageSquare, ThumbsUp, ThumbsDown, Send } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface CommentFormProps {
  targetType: 'user' | 'company'
  targetId: string
  onCommentCreated?: () => void
}

export function CommentForm({ targetType, targetId, onCommentCreated }: CommentFormProps) {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [pros, setPros] = useState('')
  const [cons, setCons] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Prevent self-commenting
  const isSelfComment = targetType === 'user' && user?.id === targetId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      showError('Lỗi', 'Vui lòng đăng nhập để bình luận')
      return
    }

    if (!pros.trim() || !cons.trim()) {
      showError('Lỗi', 'Vui lòng điền đầy đủ ưu điểm và nhược điểm')
      return
    }

    setIsSubmitting(true)

    try {
      const data: CreateCommentData = {
        targetType,
        targetId,
        pros: pros.trim(),
        cons: cons.trim(),
      }

      await commentsApi.createComment(data)
      showSuccess('Thành công', 'Đã thêm bình luận thành công')
      setPros('')
      setCons('')
      onCommentCreated?.()
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể thêm bình luận')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <div className="rounded-full bg-muted p-3">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Đăng nhập để bình luận</p>
              <p className="text-sm text-muted-foreground mt-1">
                Vui lòng đăng nhập để chia sẻ đánh giá của bạn
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isSelfComment) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <div className="rounded-full bg-muted p-3">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Không thể bình luận về chính mình</p>
              <p className="text-sm text-muted-foreground mt-1">
                Bạn chỉ có thể xem các bình luận về mình
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Viết bình luận
        </CardTitle>
        <CardDescription>
          Chia sẻ đánh giá của bạn để giúp người khác hiểu rõ hơn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pros Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1.5">
                  <ThumbsUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <FieldLabel className="text-base font-semibold">Ưu điểm *</FieldLabel>
              </div>
              <Textarea
                value={pros}
                onChange={(e) => setPros(e.target.value)}
                placeholder="Nhập những điểm tích cực, ưu điểm..."
                rows={5}
                maxLength={1000}
                required
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Chia sẻ những điều bạn thích hoặc đánh giá tích cực
                </p>
                <span className="text-xs text-muted-foreground">
                  {pros.length}/1000
                </span>
              </div>
            </div>

            {/* Cons Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-1.5">
                  <ThumbsDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <FieldLabel className="text-base font-semibold">Nhược điểm *</FieldLabel>
              </div>
              <Textarea
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                placeholder="Nhập những điểm cần cải thiện, nhược điểm..."
                rows={5}
                maxLength={1000}
                required
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Chia sẻ những điều cần cải thiện một cách xây dựng
                </p>
                <span className="text-xs text-muted-foreground">
                  {cons.length}/1000
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPros('')
                setCons('')
              }}
              disabled={isSubmitting || (!pros && !cons)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || !pros.trim() || !cons.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Gửi bình luận
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

