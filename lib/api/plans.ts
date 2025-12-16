import { config } from '../config'

const API_BASE_URL = config.api.baseUrl

export interface Plan {
  _id: string
  name: string
  price: number
  durationInDays: number
  limit: {
    limitPost: number
    postDuration: number
  }
  feature: {
    highlightBadge: boolean
    urgentBadge: boolean
    trainingSupport: boolean
  }
  type: 'free' | 'basic' | 'expert'
  isTemplate: boolean
}

export interface PlansResponse {
  success: boolean
  data: {
    plans: Plan[]
    message: string
  }
}

export const plansApi = {
  // Get all plan templates
  async getPlanTemplates(): Promise<Plan[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/plans/templates`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.error?.message || `Failed to fetch plan templates: ${response.statusText}`)
      }

      const result: PlansResponse = await response.json()
      
      if (!result.success || !result.data?.plans) {
        throw new Error(result.data?.message || 'Invalid response format from server')
      }

      return result.data.plans
    } catch (error: any) {
      // Handle network errors (server not running)
      if (error.message === 'Failed to fetch' || error.name === 'TypeError' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra server backend có đang chạy không.')
      }
      throw new Error(error.message || 'Failed to fetch plan templates')
    }
  },
}

