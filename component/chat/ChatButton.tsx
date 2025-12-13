"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { chatApi } from '@/lib/api/chat'
import { companiesApi } from '@/lib/api/companies'
import { useAuth } from '@/lib/auth-context'
import { useNotification } from '@/lib/notification-context'
import { useRouter } from 'next/navigation'

interface ChatButtonProps {
  employerUserId?: string
  companyId?: string
  jobId?: string
  employerName?: string
  employerAvatar?: string
}

export function ChatButton({ employerUserId, companyId, jobId, employerName, employerAvatar }: ChatButtonProps) {
  const { user } = useAuth()
  const { showError } = useNotification()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [actualEmployerUserId, setActualEmployerUserId] = useState<string | null>(employerUserId || null)

  useEffect(() => {
    // If we don't have employerUserId but have companyId, fetch it
    if (!actualEmployerUserId && companyId) {
      companiesApi.getEmployerUser(companyId)
        .then((employerUser) => {
          setActualEmployerUserId(employerUser._id)
        })
        .catch((error) => {
          console.error('Failed to fetch employer user:', error)
        })
    }
  }, [companyId, actualEmployerUserId])

  const handleStartChat = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!actualEmployerUserId) {
      showError('Lỗi', 'Không thể lấy thông tin nhà tuyển dụng')
      return
    }

    if (user.id === actualEmployerUserId) {
      showError('Lỗi', 'Bạn không thể chat với chính mình')
      return
    }

    try {
      setLoading(true)
      const conv = await chatApi.getOrCreateConversation({
        userId: actualEmployerUserId,
        jobId: jobId,
      })
      // Redirect to chat page with conversation ID
      router.push(`/chat?conversationId=${conv._id}`)
    } catch (error: any) {
      console.error('Failed to start chat:', error)
      showError('Lỗi', error.message || 'Không thể bắt đầu cuộc trò chuyện')
    } finally {
      setLoading(false)
    }
  }

  // Don't render if we don't have employer user ID
  if (!actualEmployerUserId) {
    return null
  }

  return (
    <Button
      onClick={handleStartChat}
      disabled={loading}
      variant="outline"
      className="w-full"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      {loading ? 'Đang tải...' : 'Chat với nhà tuyển dụng'}
    </Button>
  )
}

