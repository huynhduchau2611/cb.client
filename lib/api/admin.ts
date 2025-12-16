import { config } from '../config'
import { Job, JobListResponse } from './jobs'

export interface AdminJobFilters {
  page?: number
  limit?: number
  status?: string
  companyId?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface AdminJobStatsResponse {
  success: boolean
  data: {
    totalJobs: number
    pendingJobs: number
    approvedJobs: number
    rejectedJobs: number
    jobsByCompany: Array<{
      _id: string
      companyName: string
      count: number
    }>
  }
}

export interface AdminOverviewStatsResponse {
  success: boolean
  data: {
    totalUsers: number
    totalJobs: number
    pendingPartners: number
    totalBlogs: number
    usersByRole: {
      admin: number
      employer: number
      candidate: number
    }
  }
}

/**
 * Admin API service for job management
 * Requires admin authentication
 */
export class AdminJobsAPI {
  private static baseUrl = `${config.api.baseUrl}/admin`
  
  /**
   * Get auth token from localStorage
   */
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  }

  /**
   * Get all jobs (admin can see all statuses)
   */
  static async getAllJobs(filters: AdminJobFilters = {}): Promise<JobListResponse> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const url = `${this.baseUrl}/jobs?${params.toString()}`
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error?.message || 'Failed to fetch jobs')
    }

    return response.json()
  }

  /**
   * Get job statistics for admin dashboard
   */
  static async getJobStats(): Promise<AdminJobStatsResponse> {
    const response = await fetch(`${this.baseUrl}/jobs/stats`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error?.message || 'Failed to fetch job stats')
    }

    return response.json()
  }

  /**
   * Approve a pending job post
   */
  static async approveJob(jobId: string): Promise<{ success: boolean; data: { post: Job; message: string } }> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}/approve`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to approve job')
    }

    return data
  }

  /**
   * Reject a pending job post
   */
  static async rejectJob(jobId: string, rejectionReason?: string): Promise<{ success: boolean; data: { post: Job; message: string } }> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}/reject`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ rejectionReason }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to reject job')
    }

    return data
  }

  /**
   * Toggle featured status for a job post
   */
  static async toggleFeatured(jobId: string): Promise<{ success: boolean; data: { post: Job; message: string } }> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}/toggle-featured`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to toggle featured status')
    }

    return data
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(filters: { page?: number; limit?: number; search?: string; includeInactive?: boolean } = {}): Promise<{
    success: boolean
    data: {
      users: Array<{
        _id: string
        fullName: string
        email: string
        role: string
        phone?: string
        isActive?: boolean
        createdAt: string
      }>
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }
  }> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const url = `${this.baseUrl}/users?${params.toString()}`
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error?.message || 'Failed to fetch users')
    }

    return response.json()
  }

  /**
   * Get user by ID (admin only)
   */
  static async getUserById(userId: string): Promise<{
    success: boolean
    data: {
      user: {
        _id: string
        fullName: string
        email: string
        role: string
        phone?: string
        avatar?: string
        isActive?: boolean
        createdAt: string
        updatedAt: string
      }
    }
  }> {
    const response = await fetch(`${this.baseUrl}/users/${userId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error?.message || 'Failed to fetch user')
    }

    return response.json()
  }

  /**
   * Toggle user status (lock/unlock) (admin only)
   */
  static async toggleUserStatus(userId: string): Promise<{
    success: boolean
    data: {
      user: {
        _id: string
        fullName: string
        email: string
        role: string
        phone?: string
        avatar?: string
        isActive: boolean
        createdAt: string
        updatedAt: string
      }
      message: string
    }
  }> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/toggle-status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error?.message || 'Failed to toggle user status')
    }

    return response.json()
  }

  /**
   * Get admin dashboard overview statistics
   */
  static async getOverviewStats(): Promise<AdminOverviewStatsResponse> {
    const response = await fetch(`${this.baseUrl}/overview/stats`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error?.message || 'Failed to fetch overview stats')
    }

    return response.json()
  }
}

