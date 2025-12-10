/**
 * Vietnam Provinces API Client
 * Using: https://provinces.open-api.vn/api/
 */

export interface Province {
  code: number
  name: string
  name_en: string
  full_name: string
  full_name_en: string
  code_name: string
}

export interface District {
  code: number
  name: string
  name_en: string
  full_name: string
  full_name_en: string
  code_name: string
  province_code: number
}

export interface Ward {
  code: number
  name: string
  name_en: string
  full_name: string
  full_name_en: string
  code_name: string
  district_code: number
}

export interface ProvinceWithDistricts extends Province {
  districts: District[]
}

export interface DistrictWithWards extends District {
  wards: Ward[]
}

const BASE_URL = 'https://provinces.open-api.vn/api'

class ProvincesAPI {
  /**
   * Get all provinces
   */
  static async getProvinces(): Promise<Province[]> {
    try {
      const response = await fetch(`${BASE_URL}/p/`)
      if (!response.ok) {
        throw new Error('Failed to fetch provinces')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching provinces:', error)
      throw error
    }
  }

  /**
   * Get province by code with all districts
   */
  static async getProvinceWithDistricts(provinceCode: number): Promise<ProvinceWithDistricts> {
    try {
      const response = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`)
      if (!response.ok) {
        throw new Error('Failed to fetch province details')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching province details:', error)
      throw error
    }
  }

  /**
   * Get all districts of a province
   */
  static async getDistrictsByProvince(provinceCode: number): Promise<District[]> {
    try {
      const provinceData = await this.getProvinceWithDistricts(provinceCode)
      return provinceData.districts || []
    } catch (error) {
      console.error('Error fetching districts:', error)
      throw error
    }
  }

  /**
   * Get district by code with all wards
   */
  static async getDistrictWithWards(districtCode: number): Promise<DistrictWithWards> {
    try {
      const response = await fetch(`${BASE_URL}/d/${districtCode}?depth=2`)
      if (!response.ok) {
        throw new Error('Failed to fetch district details')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching district details:', error)
      throw error
    }
  }

  /**
   * Get all wards of a district
   */
  static async getWardsByDistrict(districtCode: number): Promise<Ward[]> {
    try {
      const districtData = await this.getDistrictWithWards(districtCode)
      return districtData.wards || []
    } catch (error) {
      console.error('Error fetching wards:', error)
      throw error
    }
  }
}

export default ProvincesAPI

