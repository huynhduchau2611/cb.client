import { Company } from "@/lib/api/partner"
import { VietQRBusinessResponse } from "@/lib/api/vietqr"

export type AdminSection = 
  | 'overview' 
  | 'jobs' 
  | 'blogs'
  | 'users' 
  | 'partners' 
  | 'settings'

export type PartnerTab = 'pending' | 'approved' | 'rejected'

export interface TaxCodeInfo {
  data: VietQRBusinessResponse | null
  loading: boolean
  error?: string
}

export interface AdminDashboardProps {
  activeSection: AdminSection
  setActiveSection: (section: AdminSection) => void
  activePartnerTab: PartnerTab
  setActivePartnerTab: (tab: PartnerTab) => void
  selectedCompany: Company | null
  setSelectedCompany: (company: Company | null) => void
  showRejectDialog: boolean
  setShowRejectDialog: (show: boolean) => void
  rejectionReason: string
  setRejectionReason: (reason: string) => void
  showDetailDialog: boolean
  setShowDetailDialog: (show: boolean) => void
  taxCodeInfo: Record<string, TaxCodeInfo>
  setTaxCodeInfo: (info: Record<string, TaxCodeInfo>) => void
  verifyingTaxCode: string | null
  setVerifyingTaxCode: (taxCode: string | null) => void
  handleApprovePartner: (companyId: string) => Promise<void>
  handleRejectPartner: () => Promise<void>
  handleToggleFeatured: (companyId: string, isFeatured: boolean) => Promise<void>
  handleVerifyTaxCode: (taxCode: string) => Promise<void>
  handleViewDetails: (company: Company) => void
  loadPartnerRequests: (status?: PartnerTab, page?: number) => Promise<void>
  requests: Company[]
  isLoadingPartners: boolean
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
  }
}
