import { config } from '../config'

const API_BASE_URL = config.api.baseUrl

export interface CreatePaymentRequest {
  planType: 'basic' | 'expert'
}

export interface CreatePaymentResponse {
  success: boolean
  data: {
    paymentLink: string
    transaction: {
      id: string
      orderId: string
      amount: number
      status: 'pending' | 'completed' | 'fail'
      plan: string
    }
    message: string
  }
}

export interface PaymentStatusResponse {
  success: boolean
  data: {
    transaction: {
      id: string
      orderId: string
      amount: number
      status: 'pending' | 'completed' | 'fail'
      description: string
      plan: any
      paymentLink?: string
      createdAt: string
      updatedAt: string
    }
  }
}

export interface Transaction {
  _id: string
  orderId: string
  amount: number
  status: 'pending' | 'completed' | 'fail'
  description: string
  plan: {
    _id: string
    name: string
    price: number
    type: 'free' | 'basic' | 'expert'
    limit: {
      limitPost: number
      postDuration: number
    }
    feature: {
      highlightBadge: boolean
      urgentBadge: boolean
      trainingSupport: boolean
    }
    durationInDays: number
  }
  paymentLink?: string
  createdAt: string
  updatedAt: string
}

export interface TransactionsResponse {
  success: boolean
  data: {
    transactions: Transaction[]
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

export const paymentsApi = {
  /**
   * Create payment link for plan upgrade
   */
  async createPaymentLink(planType: 'basic' | 'expert'): Promise<CreatePaymentResponse> {
    const token = localStorage.getItem('token')
    
    if (!token) {
      throw new Error('Bạn cần đăng nhập để thực hiện thanh toán')
    }

    const response = await fetch(`${API_BASE_URL}/payments/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ planType }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error?.message || 'Không thể tạo link thanh toán')
    }

    return result
  },

  /**
   * Get payment status by transaction ID
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    const token = localStorage.getItem('token')
    
    if (!token) {
      throw new Error('Bạn cần đăng nhập để xem trạng thái thanh toán')
    }

    const response = await fetch(`${API_BASE_URL}/payments/status/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error?.message || 'Không thể lấy trạng thái thanh toán')
    }

    return result
  },

  /**
   * Get all transactions for current company
   */
  async getMyTransactions(params?: {
    page?: number
    limit?: number
    status?: 'pending' | 'completed' | 'fail'
  }): Promise<TransactionsResponse> {
    const token = localStorage.getItem('token')
    
    if (!token) {
      throw new Error('Bạn cần đăng nhập để xem giao dịch')
    }

    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)

    const response = await fetch(
      `${API_BASE_URL}/payments/transactions?${queryParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error?.message || 'Không thể lấy danh sách giao dịch')
    }

    return result
  },
}

