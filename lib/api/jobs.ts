import { config } from '../config'

// Types for API responses
export interface Job {
  _id: string
  title: string
  description: string
  salary: number
  techStack: string[]
  typeWork: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote' | 'hybrid'
  candidateCount: number
  candidateApplied: number
  status: 'approved' | 'pending' | 'rejected' | 'expired'
  location?: string
  rejectionReason?: string
  company: {
    _id: string
    name: string
    avatarUrl: string
    size: string
    typeCompany: string
    province: string
    district: string
    ward?: string
    taxCode?: string
    workingTime?: string
    user?: {
      _id: string
      fullName: string
      email: string
      avatar?: string
    } | string
  }
  createdAt: string
  updatedAt: string
  isHidden?: boolean
  hiddenAt?: string | null
  isFeatured?: boolean
}

export interface JobListResponse {
  success: boolean
  data: {
    posts: Job[]
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

export interface JobDetailResponse {
  success: boolean
  data: {
    post: Job
  }
}

export interface JobStatsResponse {
  success: boolean
  data: {
    totalJobs: number
    jobsByType: Array<{ _id: string; count: number }>
    jobsByLocation: Array<{ _id: string; count: number }>
    averageSalary: number
    totalCompanies: number
    totalCandidates: number
  }
}

export interface JobFilters {
  page?: number
  limit?: number
  status?: string
  typeWork?: string
  techStack?: string | string[]
  minSalary?: number
  maxSalary?: number
  companyId?: string
  search?: string
  location?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// API service functions
export class JobsAPI {
  private static baseUrl = `${config.api.baseUrl}/public`

  /**
   * Get all jobs with pagination and filtering
   */
  static async getJobs(filters: JobFilters = {}): Promise<JobListResponse> {
    const maxRetries = 2
    let lastError: any = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const params = new URLSearchParams()
        
        // Add filters to params
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v))
            } else {
              params.append(key, String(value))
            }
          }
        })

        const url = `${this.baseUrl}/posts?${params.toString()}`

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.status === 429) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000 // 1s, 2s
            console.warn(`Rate limit hit for getJobs, retrying in ${delay / 1000}s... (Attempt ${attempt + 1})`)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          } else {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData?.error?.message || 'Quá nhiều yêu cầu. Vui lòng thử lại sau.')
          }
        }

        if (!response.ok) {
          console.error('❌ API Error:', {
            status: response.status,
            statusText: response.statusText,
            url
          })
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData?.error?.message || `Failed to fetch jobs: ${response.statusText}`)
        }

        const data = await response.json()
        return data
      } catch (error: any) {
        lastError = error
        if (attempt < maxRetries && error.message?.includes('429')) {
          continue
        }
        throw error
      }
    }
    
    throw lastError || new Error('Failed to fetch jobs')
  }

  /**
   * Get job detail by ID
   */
  static async getJobById(id: string): Promise<JobDetailResponse> {
    const response = await fetch(`${this.baseUrl}/posts/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Job not found')
      }
      throw new Error(`Failed to fetch job: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get job statistics with retry logic
   */
  static async getJobStats(): Promise<JobStatsResponse> {
    const maxRetries = 2
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }

        const response = await fetch(`${this.baseUrl}/posts/stats`, {
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
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData?.error?.message || `Failed to fetch job stats: ${response.statusText}`)
        }

        return response.json()
      } catch (error: any) {
        lastError = error
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
          if (attempt < maxRetries) continue
          throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.')
        }
        if (attempt < maxRetries && error.message?.includes('429')) {
          continue
        }
        throw error
      }
    }

    throw lastError || new Error('Failed to fetch job stats')
  }

  /**
   * Get featured jobs with retry logic
   */
  static async getFeaturedJobs(limit: number = 5): Promise<JobListResponse> {
    const maxRetries = 2
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }

        const response = await fetch(`${this.baseUrl}/posts/featured?limit=${limit}`, {
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
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData?.error?.message || `Failed to fetch featured jobs: ${response.statusText}`)
        }

        return response.json()
      } catch (error: any) {
        lastError = error
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
          if (attempt < maxRetries) continue
          throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.')
        }
        if (attempt < maxRetries && error.message?.includes('429')) {
          continue
        }
        throw error
      }
    }

    throw lastError || new Error('Failed to fetch featured jobs')
  }

  /**
   * Get jobs by company ID
   */
  static async getJobsByCompany(companyId: string, page: number = 1, limit: number = 10): Promise<JobListResponse> {
    const response = await fetch(`${this.baseUrl}/companies/${companyId}/posts?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch company jobs: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Search jobs with text query
   */
  static async searchJobs(query: string, filters: Omit<JobFilters, 'search'> = {}): Promise<JobListResponse> {
    return this.getJobs({ ...filters, search: query })
  }

  /**
   * Get jobs by work type
   */
  static async getJobsByType(typeWork: string, filters: Omit<JobFilters, 'typeWork'> = {}): Promise<JobListResponse> {
    return this.getJobs({ ...filters, typeWork })
  }

  /**
   * Get jobs by salary range
   */
  static async getJobsBySalaryRange(minSalary: number, maxSalary: number, filters: Omit<JobFilters, 'minSalary' | 'maxSalary'> = {}): Promise<JobListResponse> {
    return this.getJobs({ ...filters, minSalary, maxSalary })
  }

  /**
   * Get search suggestions
   */
  static async getSearchSuggestions(query: string, limit: number = 10): Promise<{ success: boolean; data: { suggestions: SearchSuggestion[] } }> {
    const response = await fetch(`${this.baseUrl}/posts/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch search suggestions: ${response.statusText}`)
    }

    return response.json()
  }
}

// Search suggestion interface
export interface SearchSuggestion {
  type: 'job' | 'company' | 'location' | 'skill'
  title: string
  subtitle?: string
  value: string
  count?: number
}

// Utility functions for formatting
export const formatSalary = (salary: number): string => {
  if (salary >= 1000000) {
    return `${(salary / 1000000).toFixed(1)}M VNĐ`
  }
  return `${salary.toLocaleString('vi-VN')} VNĐ`
}

export const formatWorkType = (typeWork: string): string => {
  const typeMap: Record<string, string> = {
    'full-time': 'Toàn thời gian',
    'part-time': 'Bán thời gian',
    'contract': 'Hợp đồng',
    'internship': 'Thực tập',
    'remote': 'Remote',
    'hybrid': 'Hybrid'
  }
  return typeMap[typeWork] || typeWork
}

export const formatCompanySize = (size: string): string => {
  const sizeMap: Record<string, string> = {
    '1-50': '1-50 nhân viên',
    '51-200': '51-200 nhân viên',
    '201-500': '201-500 nhân viên',
    '501-1000': '501-1000 nhân viên',
    '1000+': '1000+ nhân viên'
  }
  return sizeMap[size] || size
}

export const formatWorkingTime = (workingTime: string): string => {
  const timeMap: Record<string, string> = {
    'monday-to-friday': 'Thứ 2 - Thứ 6',
    'monday-to-saturday': 'Thứ 2 - Thứ 7'
  }
  return timeMap[workingTime] || workingTime
}

export const formatCompanyType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'technology': 'Công nghệ',
    'finance': 'Tài chính',
    'healthcare': 'Y tế',
    'education': 'Giáo dục',
    'retail': 'Bán lẻ',
    'manufacturing': 'Sản xuất',
    'consulting': 'Tư vấn',
    'media': 'Truyền thông',
    'real-estate': 'Bất động sản',
    'transportation': 'Vận tải',
    'energy': 'Năng lượng',
    'government': 'Chính phủ',
    'non-profit': 'Phi lợi nhuận',
    'startup': 'Startup',
    'other': 'Khác'
  }
  return typeMap[type] || type
}

export const formatJobStatus = (status: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
  switch (status) {
    case 'approved':
      return { label: 'Đã duyệt', variant: 'default' }
    case 'pending':
      return { label: 'Chờ duyệt', variant: 'secondary' }
    case 'rejected':
      return { label: 'Từ chối', variant: 'destructive' }
    case 'expired':
      return { label: 'Hết hạn', variant: 'outline' }
    default:
      return { label: status, variant: 'outline' }
  }
}

export const formatCompanyStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Chờ duyệt',
    'approved': 'Đã duyệt',
    'rejected': 'Đã từ chối'
  }
  return statusMap[status] || status
}

/**
 * Calculate if a job post is expired based on createdAt and postDuration
 */
export const isJobExpired = (createdAt: string, postDuration: number): boolean => {
  const now = new Date()
  const createdDate = new Date(createdAt)
  const expirationDate = new Date(createdDate.getTime() + postDuration * 24 * 60 * 60 * 1000)
  return now > expirationDate
}

/**
 * Get expiration date for a job post
 */
export const getJobExpirationDate = (createdAt: string, postDuration: number): Date => {
  const createdDate = new Date(createdAt)
  return new Date(createdDate.getTime() + postDuration * 24 * 60 * 60 * 1000)
}

/**
 * Get days remaining until expiration
 */
export const getDaysRemaining = (createdAt: string, postDuration: number): number => {
  const now = new Date()
  const expirationDate = getJobExpirationDate(createdAt, postDuration)
  const diffTime = expirationDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// ==================== EMPLOYER API ====================
// Protected endpoints for employers to manage their job posts

export interface CreateJobRequest {
  title: string
  description: string
  salary: number
  techStack: string[]
  typeWork: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote' | 'hybrid'
  candidateCount: number
}

export interface CreateJobResponse {
  success: boolean
  data: {
    post: Job
    message: string
    remainingPosts: number
  }
}

export interface MyJobStatsResponse {
  success: boolean
  data: {
    stats: {
      totalPosts: number
      activePosts: number
      approvedPosts: number
      pendingPosts: number
      rejectedPosts: number
      remainingPosts: number
    }
    plan: {
      name: string
      maxPosts: number
      postDuration: number
    } | null
  }
}

export interface UpdateJobRequest {
  title?: string
  description?: string
  salary?: number
  techStack?: string[]
  typeWork?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote' | 'hybrid'
  candidateCount?: number
}

/**
 * Employer-specific API service
 * Requires authentication token
 */
export class EmployerJobsAPI {
  private static baseUrl = `${config.api.baseUrl}/jobs`
  
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
   * Create a new job post
   * Checks plan limits before creating
   */
  static async createJob(jobData: CreateJobRequest): Promise<CreateJobResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(jobData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create job')
    }

    return data
  }

  /**
   * Get all jobs posted by the employer
   */
  static async getMyJobs(filters: { page?: number; limit?: number; status?: string } = {}): Promise<JobListResponse> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const url = `${this.baseUrl}/my-jobs?${params.toString()}`
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
   * Get job posting statistics for employer
   */
  static async getMyJobStats(): Promise<MyJobStatsResponse> {
    const response = await fetch(`${this.baseUrl}/my-stats`, {
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
   * Update a job post
   * Note: Status will be reset to 'pending' after update
   */
  static async updateJob(jobId: string, updateData: UpdateJobRequest): Promise<{ success: boolean; data: { post: Job; message: string } }> {
    const response = await fetch(`${this.baseUrl}/${jobId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updateData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to update job')
    }

    return data
  }

  /**
   * Delete a job post
   */
  static async deleteJob(jobId: string): Promise<{ success: boolean; data: { message: string } }> {
    const response = await fetch(`${this.baseUrl}/${jobId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to delete job')
    }

    return data
  }

  /**
   * Get job detail by ID (for employer - can see any status)
   */
  static async getMyJobById(jobId: string): Promise<JobDetailResponse> {
    const response = await fetch(`${this.baseUrl}/my-job/${jobId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error?.message || 'Failed to fetch job details')
    }

    return response.json()
  }

  /**
   * Update job visibility (hide/show)
   */
  static async updateJobVisibility(jobId: string, isHidden: boolean): Promise<JobDetailResponse> {
    const response = await fetch(`${this.baseUrl}/${jobId}/visibility`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ isHidden }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error?.message || 'Không thể cập nhật hiển thị của tin tuyển dụng')
    }

    return response.json()
  }
}
