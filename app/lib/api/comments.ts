import { config } from '../config'

const API_BASE_URL = config.api.baseUrl

export interface CommentUser {
  _id: string
  fullName: string
  email: string
  avatar?: string
  role: string
}

export interface Comment {
  _id: string
  user: CommentUser | string
  targetType: 'user' | 'company'
  targetId: string
  pros: string
  cons: string
  upCount: number
  upvotedBy: string[]
  createdAt: string
  updatedAt: string
}

export interface CommentResponse {
  success: boolean
  data: {
    comment: Comment
  }
}

export interface CommentsListResponse {
  success: boolean
  data: {
    comments: Comment[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }
}

export interface CreateCommentData {
  targetType: 'user' | 'company'
  targetId: string
  pros: string
  cons: string
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export const commentsApi = {
  /**
   * Get comments for a target (user or company)
   */
  async getComments(params: {
    targetType: 'user' | 'company'
    targetId: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<CommentsListResponse['data']> {
    const maxRetries = 2
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }

        const queryParams = new URLSearchParams({
          targetType: params.targetType,
          targetId: params.targetId,
          ...(params.page && { page: params.page.toString() }),
          ...(params.limit && { limit: params.limit.toString() }),
          ...(params.sortBy && { sortBy: params.sortBy }),
          ...(params.sortOrder && { sortOrder: params.sortOrder }),
        })

        const response = await fetch(`${API_BASE_URL}/comments?${queryParams}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          // Retry on 429, otherwise throw immediately
          if (response.status === 429 && attempt < maxRetries) {
            lastError = new Error('Quá nhiều yêu cầu. Đang thử lại...')
            continue
          }
          const error = await response.json()
          throw new Error(error.error?.message || 'Failed to fetch comments')
        }

        const result: CommentsListResponse = await response.json()
        return result.data
      } catch (error: any) {
        lastError = error
        if (attempt < maxRetries && error.message?.includes('429')) {
          continue
        }
        throw error
      }
    }

    throw lastError || new Error('Failed to fetch comments')
  },

  /**
   * Create a new comment
   */
  async createComment(data: CreateCommentData): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to create comment')
    }

    const result: CommentResponse = await response.json()
    return result.data.comment
  },

  /**
   * Upvote a comment
   */
  async upvoteComment(commentId: string): Promise<{ comment: Comment; isUpvoted: boolean }> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/upvote`, {
      method: 'POST',
      headers: await getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to upvote comment')
    }

    const result = await response.json()
    return result.data
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to delete comment')
    }
  },
}

