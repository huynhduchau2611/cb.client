import { config } from '../config'

export enum BLOG_STATUS {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface Blog {
  _id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  coverImage?: string
  author: {
    _id: string
    fullName: string
    email?: string
    avatar?: string
  } | null
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  tags: string[]
  viewCount: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateBlogRequest {
  title: string
  content: string
  excerpt?: string
  coverImage?: string
  tags?: string[]
}

export interface BlogListResponse {
  success: boolean
  data: {
    blogs: Blog[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
  }
}

export interface BlogDetailResponse {
  success: boolean
  data: {
    blog: Blog
  }
}

export interface BlogStatsResponse {
  success: boolean
  data: {
    totalBlogs: number
    pendingBlogs: number
    approvedBlogs: number
    rejectedBlogs: number
    totalViews: number
  }
}

// Public Blogs API
export class PublicBlogsAPI {
  private static baseUrl = `${config.api.baseUrl}/public/blogs`

  static async getBlogs(filters: {
    page?: number
    limit?: number
    search?: string
    tag?: string
  } = {}): Promise<BlogListResponse> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await fetch(`${this.baseUrl}?${params.toString()}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch blogs')
    }

    return data
  }

  static async getBlogBySlug(slug: string): Promise<BlogDetailResponse> {
    const response = await fetch(`${this.baseUrl}/${slug}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch blog')
    }

    return data
  }
}

// User Blogs API (Protected)
export class UserBlogsAPI {
  private static baseUrl = `${config.api.baseUrl}/blogs`

  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  }

  static async createBlog(blogData: CreateBlogRequest): Promise<BlogDetailResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(blogData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create blog')
    }

    return data
  }

  static async getMyBlogs(filters: {
    page?: number
    limit?: number
    status?: string
  } = {}): Promise<BlogListResponse> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await fetch(`${this.baseUrl}/my-blogs?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch your blogs')
    }

    return data
  }

  static async getMyBlogById(id: string): Promise<BlogDetailResponse> {
    const response = await fetch(`${this.baseUrl}/my-blogs/${id}`, {
      headers: this.getAuthHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch blog')
    }

    return data
  }

  static async updateBlog(id: string, blogData: Partial<CreateBlogRequest>): Promise<BlogDetailResponse> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(blogData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to update blog')
    }

    return data
  }

  static async deleteBlog(id: string): Promise<{ success: boolean; data: { message: string } }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to delete blog')
    }

    return data
  }
}

// Admin Blogs API
export class AdminBlogsAPI {
  private static baseUrl = `${config.api.baseUrl}/admin/blogs`

  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  }

  static async getAllBlogs(filters: {
    page?: number
    limit?: number
    status?: string
    search?: string
  } = {}): Promise<BlogListResponse> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch blogs')
    }

    return data
  }

  static async approveBlog(id: string): Promise<BlogDetailResponse> {
    const response = await fetch(`${this.baseUrl}/${id}/approve`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to approve blog')
    }

    return data
  }

  static async rejectBlog(id: string, rejectionReason?: string): Promise<BlogDetailResponse> {
    const response = await fetch(`${this.baseUrl}/${id}/reject`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ rejectionReason }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to reject blog')
    }

    return data
  }

  static async getBlogStats(): Promise<BlogStatsResponse> {
    const response = await fetch(`${this.baseUrl}/stats`, {
      headers: this.getAuthHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch blog statistics')
    }

    return data
  }
}

// Utility functions
export function formatBlogStatus(status: string): { text: string; color: string } {
  switch (status) {
    case 'pending':
      return { text: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800' }
    case 'approved':
      return { text: 'Đã duyệt', color: 'bg-green-100 text-green-800' }
    case 'rejected':
      return { text: 'Từ chối', color: 'bg-red-100 text-red-800' }
    default:
      return { text: status, color: 'bg-gray-100 text-gray-800' }
  }
}

export function extractExcerpt(content: string, maxLength: number = 200): string {
  if (!content) return ''
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, '').trim()
  // Trim and limit length
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

export function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatReadingTime(content: string): string {
  if (!content) return '0 phút đọc'
  const wordsPerMinute = 200
  const text = content.replace(/<[^>]*>/g, '')
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute))
  return `${minutes} phút đọc`
}

