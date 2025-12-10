import { config } from '../config'

const API_BASE_URL = config.api.baseUrl

export interface Conversation {
  _id: string
  users: Array<{
    _id: string
    fullName: string
    email: string
    avatar?: string
  }>
  job?: {
    _id: string
    title: string
    company: {
      _id: string
      name: string
    }
  }
  lastMessage?: Message
  lastMessageAt?: string
  otherUser?: {
    _id: string
    fullName: string
    email: string
    avatar?: string
  }
  createdAt: string
  updatedAt: string
}

export interface Message {
  _id: string
  conversation: string
  sender: {
    _id: string
    fullName: string
    email: string
    avatar?: string
  }
  content: string
  isRead: boolean
  readAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateConversationRequest {
  userId: string
  jobId?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    message: string
    details?: any
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export const chatApi = {
  /**
   * Get or create a conversation
   */
  async getOrCreateConversation(data: CreateConversationRequest): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to get or create conversation')
    }

    const result: ApiResponse<Conversation> = await response.json()
    return result.data
  },

  /**
   * Get all conversations for current user
   */
  async getConversations(): Promise<Conversation[]> {
    const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to get conversations')
    }

    const result: ApiResponse<Conversation[]> = await response.json()
    return result.data
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, page: number = 1, limit: number = 50): Promise<Message[]> {
    const response = await fetch(
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: await getAuthHeaders(),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to get messages')
    }

    const result: ApiResponse<Message[]> = await response.json()
    return result.data
  },

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/read`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to mark messages as read')
    }
  },

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/chat/unread-count`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to get unread count')
    }

    const result: ApiResponse<{ unreadCount: number }> = await response.json()
    return result.data.unreadCount
  },

  /**
   * Get user online status
   */
  async getUserOnlineStatus(userId: string): Promise<{ isOnline: boolean; lastSeen: string | null }> {
    const response = await fetch(`${API_BASE_URL}/chat/users/${userId}/online-status`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to get user online status')
    }

    const result: ApiResponse<{ isOnline: boolean; lastSeen: string | null }> = await response.json()
    return result.data
  },
}

