import { config } from '../config'

const API_BASE_URL = config.api.baseUrl

export interface PartnerRequestData {
  name: string
  avatarUrl?: string
  phone?: string
  taxCode: string
  workingTime: 'monday-to-friday' | 'monday-to-saturday'
  size: '1-50' | '51-200' | '201-500' | '501-1000' | '1000+'
  typeCompany: string
  provinceCode: string
  province: string
  districtCode: string
  district: string
  wardCode: string
  ward: string
  description?: string
  website?: string
}

export interface Company extends PartnerRequestData {
  _id: string
  status: 'pending' | 'approved' | 'rejected'
  avatarUrl?: string
  phone?: string
  user: {
    _id: string
    fullName: string
    email: string
    phone?: string
  } | string
  plan?: any
  rejectionReason?: string
  isFeatured?: boolean
  jobCount?: number
  createdAt: string
  updatedAt: string
}

export interface PartnerRequestsResponse {
  requests: Company[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

export const partnerApi = {
  // Submit partner request
  async submitRequest(data: PartnerRequestData): Promise<{ company: Company; message: string }> {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/companies/partner-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to submit partner request')
    }

    return result.data
  },

  // Get my company
  async getMyCompany(): Promise<Company> {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/companies/my-company`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch company')
      }

      return result.data.company
    } catch (error: any) {
      // Handle network errors gracefully - don't throw for connection errors
      // This allows the pricing page to continue even if company fetch fails
      if (error.message === 'Failed to fetch' || error.name === 'TypeError' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error('Company not found') // Treat as "not found" so UI continues
      }
      throw error
    }
  },

  // Get all partner requests (Admin only)
  async getAllRequests(params?: {
    page?: number
    limit?: number
    status?: 'pending' | 'approved' | 'rejected'
  }): Promise<PartnerRequestsResponse> {
    const token = localStorage.getItem('token')
    const queryParams = new URLSearchParams()
    
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)

    const response = await fetch(
      `${API_BASE_URL}/companies/partner-requests?${queryParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to fetch partner requests')
    }

    return result.data
  },

  // Approve partner request (Admin only)
  async approveRequest(companyId: string): Promise<{ company: Company; message: string }> {
    const token = localStorage.getItem('token')
    const response = await fetch(
      `${API_BASE_URL}/companies/partner-requests/${companyId}/approve`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to approve request')
    }

    return result.data
  },

  // Reject partner request (Admin only)
  async rejectRequest(
    companyId: string,
    rejectionReason?: string
  ): Promise<{ company: Company; message: string }> {
    const token = localStorage.getItem('token')
    const response = await fetch(
      `${API_BASE_URL}/companies/partner-requests/${companyId}/reject`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rejectionReason }),
      }
    )

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to reject request')
    }

    return result.data
  },

  // Update my company profile (Employer only)
  async updateMyCompany(data: Partial<PartnerRequestData>): Promise<{ company: Company; message: string }> {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/companies/my-company`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to update company profile')
    }

    return result.data
  },

  // Upload company avatar (Employer only)
  async uploadCompanyAvatar(file: File): Promise<{ company: Company; avatarUrl: string; message: string }> {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await fetch(`${API_BASE_URL}/companies/my-company/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to upload avatar')
    }

    return result.data
  },

  // Toggle company featured status (Admin only)
  async toggleFeatured(companyId: string, isFeatured: boolean): Promise<{ company: Company; message: string }> {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/featured`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ isFeatured }),
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to toggle featured status')
    }

    return result.data
  },

  // Get featured companies (Public)
  async getFeaturedCompanies(limit: number = 6): Promise<{ companies: Company[] }> {
    const response = await fetch(`${API_BASE_URL}/companies/featured?limit=${limit}`)

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to fetch featured companies')
    }

    return result.data
  },
}

