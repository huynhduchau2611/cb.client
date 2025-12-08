import { Company } from "@/lib/api/partner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Check, Eye, X, Star } from "lucide-react"
import { PartnerListProps } from "./types"
import { config } from "@/lib/config"
import { formatCompanyStatus } from "@/lib/api/jobs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function PartnerList({ 
  requests, 
  searchQuery, 
  onViewDetails, 
  onApprove, 
  onReject,
  onToggleFeatured
}: PartnerListProps) {
  const filteredRequests = requests.filter((request) => {
    const searchLower = searchQuery.toLowerCase()
    const user = request.user && typeof request.user === 'object' ? request.user : null
    return (
      request.name?.toLowerCase().includes(searchLower) ||
      (user && (
        (user.fullName?.toLowerCase().includes(searchLower) || 
         user.email?.toLowerCase().includes(searchLower))
      ))
    )
  })

  if (filteredRequests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Không có yêu cầu nào</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {filteredRequests.map((company) => (
        <div 
          key={company._id} 
          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-start gap-4">
              {company.avatarUrl ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 flex-shrink-0">
                  <img
                    src={
                      company.avatarUrl.startsWith('http://') || company.avatarUrl.startsWith('https://')
                        ? company.avatarUrl
                        : company.avatarUrl.startsWith('/uploads')
                        ? `${config.api.baseUrl.replace('/api', '')}${company.avatarUrl}`
                        : `${config.api.baseUrl}${company.avatarUrl}`
                    }
                    alt={company.name || 'Company logo'}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                      const parent = (e.target as HTMLImageElement).parentElement
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100"><svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div>'
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="bg-gray-100 p-3 rounded-lg flex-shrink-0">
                  <Building2 className="h-6 w-6 text-gray-600" />
                </div>
              )}
              <div>
                <h3 className="font-medium">
                  {company.name || 'Chưa có tên công ty'}
                </h3>
                <p className="text-sm text-gray-600">
                  {typeof company.user === 'object' ? company.user?.fullName : 'Người đại diện'}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant={company.status === 'pending' ? 'secondary' : company.status === 'approved' ? 'default' : 'destructive'}>
                    {formatCompanyStatus(company.status)}
                  </Badge>
                  {company.taxCode && (
                    <Badge variant="outline">MST: {company.taxCode}</Badge>
                  )}
                  {company.status === 'approved' && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`featured-${company._id}`} className="text-xs text-gray-600 cursor-pointer flex items-center gap-1">
                        <Star className={`w-3 h-3 ${company.isFeatured ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                        Nổi bật
                      </Label>
                      <Switch
                        id={`featured-${company._id}`}
                        checked={company.isFeatured || false}
                        onCheckedChange={(checked) => onToggleFeatured?.(company._id, checked)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(company)}
                className="flex-1 sm:flex-none"
              >
                <Eye className="w-4 h-4 mr-2" />
                Xem chi tiết
              </Button>
              {company.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive flex-1 sm:flex-none"
                    onClick={() => onReject(company)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Từ chối
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => onApprove(company._id)}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Duyệt
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
