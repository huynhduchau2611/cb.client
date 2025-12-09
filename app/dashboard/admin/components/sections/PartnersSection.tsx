import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { PartnerList, PartnerTabs, PartnerDetail } from "../partners"
import { Company } from "@/lib/api/partner"
import { AdminDashboardProps } from "../../types"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/Pagination"

export function PartnersSection({
  activePartnerTab,
  setActivePartnerTab,
  selectedCompany,
  setSelectedCompany,
  showRejectDialog,
  setShowRejectDialog,
  rejectionReason,
  setRejectionReason,
  showDetailDialog,
  setShowDetailDialog,
  taxCodeInfo,
  handleApprovePartner,
  handleRejectPartner,
  handleToggleFeatured,
  handleVerifyTaxCode,
  loadPartnerRequests,
  requests,
  isLoadingPartners,
  pagination,
}: AdminDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleViewDetails = (company: Company) => {
    setSelectedCompany(company)
    setShowDetailDialog(true)
  }

  const handleTabChange = (value: 'pending' | 'approved' | 'rejected') => {
    setActivePartnerTab(value)
    loadPartnerRequests(value)
  }

  const handleReject = (company: Company) => {
    setSelectedCompany(company)
    setShowRejectDialog(true)
  }

  const handleConfirmReject = async () => {
    if (selectedCompany) {
      await handleRejectPartner(selectedCompany._id, rejectionReason)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý đối tác</h1>
        <p className="text-gray-600">Duyệt và quản lý yêu cầu đăng ký đối tác</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between gap-4">
          <CardTitle>Yêu cầu đăng ký đối tác</CardTitle>
        </CardHeader>
        <CardContent>
          <PartnerTabs 
            activeTab={activePartnerTab}
            onTabChange={handleTabChange}
            onSearch={setSearchQuery}
            searchQuery={searchQuery}
          />
          
          {isLoadingPartners ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <>
            <PartnerList 
              requests={requests}
              searchQuery={searchQuery}
              onViewDetails={handleViewDetails}
              onApprove={handleApprovePartner}
              onReject={handleReject}
              onToggleFeatured={handleToggleFeatured}
            />
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    disabled={isLoadingPartners}
                    variant="simple"
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu đăng ký</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Vui lòng nhập lý do từ chối yêu cầu đăng ký của đối tác này.
            </p>
            <Textarea
              placeholder="Nhập lý do từ chối..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmReject}
              disabled={!rejectionReason.trim()}
            >
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partner Detail Dialog */}
      {selectedCompany && (
        <div className={!showDetailDialog ? 'hidden' : ''}>
          <PartnerDetail 
            company={selectedCompany}
            taxCodeInfo={taxCodeInfo}
            onVerifyTaxCode={handleVerifyTaxCode}
          />
        </div>
      )}
    </div>
  )
}
