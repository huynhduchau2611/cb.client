import { Company } from "@/lib/api/partner"
import { VietQRBusinessResponse } from "@/lib/api/vietqr"

export interface PartnerListProps {
  requests: Company[]
  searchQuery: string
  onViewDetails: (company: Company) => void
  onApprove: (id: string) => void
  onReject: (company: Company) => void
  onToggleFeatured?: (companyId: string, isFeatured: boolean) => void
}

export interface PartnerDetailProps {
  company: Company
  taxCodeInfo: Record<string, { data: VietQRBusinessResponse | null; loading: boolean; error?: string }>
  onVerifyTaxCode: (taxCode: string) => void
}

export interface PartnerTabsProps {
  activeTab: 'pending' | 'approved' | 'rejected'
  onTabChange: (value: 'pending' | 'approved' | 'rejected') => void
  onSearch: (query: string) => void
  searchQuery: string
}

export interface PartnerStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected'
}

export interface CompanySizeLabelProps {
  size?: string
}
