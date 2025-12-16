// VietQR Business API for Tax Code Verification
// API Documentation: https://api.vietqr.io

export interface VietQRBusinessResponse {
  code: string
  desc: string
  data: {
    id: string
    name: string
    internationalName: string
    shortName: string
    address: string
    status: string
  }
  metadata?: {
    disclaimer: string
    source: string
    updatedAt: string
    contact: string
  }
}

export const vietqrApi = {
  /**
   * Verify tax code and get business information
   * @param taxCode - Business tax code (Mã số thuế)
   * @returns Business information from VietQR API
   */
  async verifyTaxCode(taxCode: string): Promise<VietQRBusinessResponse> {
    const response = await fetch(`https://api.vietqr.io/v2/business/${taxCode}`)
    
    if (!response.ok) {
      throw new Error('Không thể xác minh mã số thuế')
    }

    const result = await response.json()
    
    if (result.code !== '00') {
      throw new Error(result.desc || 'Mã số thuế không hợp lệ')
    }

    return result
  },

  /**
   * Check if business is active
   * @param status - Business status from API
   * @returns true if business is active
   */
  isBusinessActive(status: string): boolean {
    return status.toLowerCase().includes('đang hoạt động')
  },
}

