import { config } from '../config'

const API_BASE_URL = config.api.baseUrl

export interface CompanyUser {
  _id: string
  fullName: string
  email: string
  avatar?: string
}

export interface CompanyWithUser {
  _id: string
  name: string
  user: CompanyUser | string
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export const companiesApi = {
  /**
   * Get employer user ID from company ID
   */
  async getEmployerUser(companyId: string): Promise<CompanyUser> {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/employer`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to get employer user')
    }

    const result = await response.json()
    return result.data.user
  },
}

