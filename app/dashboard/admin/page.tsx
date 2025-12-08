"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Users, Briefcase, FileText, CheckCircle, XCircle, Clock, Calendar, LayoutDashboard, Settings, Building2, Loader2, Eye, Mail, Phone, Shield, AlertCircle, Globe, MapPin } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useNotification } from "@/lib/notification-context"
import { partnerApi, Company } from "@/lib/api/partner"
import { formatWorkingTime } from "@/lib/api/jobs"
import { vietqrApi, VietQRBusinessResponse } from "@/lib/api/vietqr"
import Image from "next/image"
import { JobsSection } from "./components/sections/JobsSection"
import { BlogsSection } from "./components/sections/BlogsSection"
import { OverviewSection } from "./components/sections/OverviewSection"
import { UsersSection } from "./components/sections/UsersSection"
import { SettingsSection } from "./components/sections/SettingsSection"
import { PartnerList } from "./components/partners/PartnerList"
import { Pagination } from "@/components/Pagination"
import { config } from "@/lib/config"

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}

function AdminDashboardContent() {
  const { showSuccess, showError } = useNotification()
  const [activeSection, setActiveSection] = useState("overview")
  
  // Partner management states
  const [requests, setRequests] = useState<Company[]>([])
  const [isLoadingPartners, setIsLoadingPartners] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [activePartnerTab, setActivePartnerTab] = useState("pending")
  const [verifyingTaxCode, setVerifyingTaxCode] = useState<string | null>(null)
  const [taxCodeInfo, setTaxCodeInfo] = useState<Record<string, { data: VietQRBusinessResponse | null; loading: boolean; error?: string }>>({})
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })
  
  
  const [partnerPage, setPartnerPage] = useState(1)

  // Load partners when partners section is active
  useEffect(() => {
    if (activeSection === "partners") {
      setPartnerPage(1)
      loadPartnerRequests(activePartnerTab as any, 1)
    }
  }, [activeSection, activePartnerTab])

  const loadPartnerRequests = async (status?: "pending" | "approved" | "rejected", page: number = 1) => {
    setIsLoadingPartners(true)
    try {
      const data = await partnerApi.getAllRequests({ status, page, limit: 10 })
      setRequests(data.requests || [])
      setPagination(prev => ({
        ...prev,
        currentPage: data.pagination?.currentPage || 1,
        totalPages: data.pagination?.totalPages || 1,
        totalItems: data.pagination?.totalItems || 0,
        itemsPerPage: data.pagination?.itemsPerPage || 10
      }))
      setPartnerPage(page)
    } catch (error: any) {
      console.error('Error loading partner requests:', error)
      showError("Lỗi", error.message || 'Không thể tải dữ liệu đối tác. Vui lòng thử lại sau.')
    } finally {
      setIsLoadingPartners(false)
    }
  }

  const handleApprovePartner = async (companyId: string) => {
    try {
      await partnerApi.approveRequest(companyId)
      showSuccess("Thành công", "Đã phê duyệt đơn đăng ký đối tác")
      loadPartnerRequests(activePartnerTab as any, partnerPage)
    } catch (error: any) {
      showError("Lỗi", error.message || 'Không thể phê duyệt đơn đăng ký')
    }
  }

  const handleRejectPartner = async () => {
    if (!selectedCompany) return

    try {
      await partnerApi.rejectRequest(selectedCompany._id, rejectionReason)
      showSuccess("Thành công", "Đã từ chối đơn đăng ký đối tác")
      setShowRejectDialog(false)
      setRejectionReason("")
      setSelectedCompany(null)
      loadPartnerRequests(activePartnerTab as any, partnerPage)
    } catch (error: any) {
      showError("Lỗi", error.message || 'Không thể từ chối đơn đăng ký')
    }
  }

  const handleToggleFeatured = async (companyId: string, isFeatured: boolean) => {
    // Check if trying to set as featured and we've reached the limit
    if (isFeatured) {
      const featuredCount = requests.filter(r => r.isFeatured && r.status === 'approved').length
      if (featuredCount >= 6) {
        showError("Lỗi", "Tối đa chỉ có 6 công ty nổi bật")
        return
      }
    }

    try {
      await partnerApi.toggleFeatured(companyId, isFeatured)
      showSuccess("Thành công", isFeatured ? "Đã đánh dấu công ty nổi bật" : "Đã bỏ đánh dấu nổi bật")
      loadPartnerRequests(activePartnerTab as any, partnerPage)
    } catch (error: any) {
      showError("Lỗi", error.message || 'Không thể cập nhật trạng thái nổi bật')
    }
  }

  const handleVerifyTaxCode = async (taxCode: string) => {
    if (!taxCode) return
    
    setTaxCodeInfo(prev => ({
      ...prev,
      [taxCode]: { ...prev[taxCode], loading: true, error: undefined }
    }))
    
    try {
      const data = await vietqrApi.verifyTaxCode(taxCode)
      setTaxCodeInfo(prev => ({
        ...prev,
        [taxCode]: { data, loading: false, error: undefined }
      }))
      return data
    } catch (error) {
      console.error('Error verifying tax code:', error)
      const errorMessage = error instanceof Error ? error.message : 'Không thể xác minh mã số thuế'
      setTaxCodeInfo(prev => ({
        ...prev,
        [taxCode]: { data: null, loading: false, error: errorMessage }
      }))
      throw error
    }
  }
  
  const handleViewDetails = (company: Company) => {
    setSelectedCompany(company)
    setShowDetailDialog(true)
  }

  const menuItems = [
    { id: "overview", label: "Tổng Quan", icon: LayoutDashboard },
    { id: "jobs", label: "Tin Tuyển Dụng", icon: Briefcase },
    { id: "blogs", label: "Blogs", icon: FileText },
    { id: "partners", label: "Đối Tác", icon: Building2 },
    { id: "users", label: "Người Dùng", icon: Users },
    { id: "settings", label: "Cài Đặt", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r min-h-screen sticky top-0">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
          <p className="text-sm text-gray-600 mt-1">Quản trị hệ thống</p>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                  activeSection === item.id ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </button>
            )
          })}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Overview Section */}
          {activeSection === "overview" && (
            <OverviewSection 
              setActiveSection={setActiveSection}
              pagination={pagination}
            />
          )}

          {/* Jobs Section */}
          {activeSection === "jobs" && <JobsSection />}

          {/* Blogs Section */}
          {activeSection === "blogs" && <BlogsSection />}

          {/* Partners Section */}
          {activeSection === "partners" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Đối tác</h1>
                <p className="text-gray-600">Duyệt và quản lý các yêu cầu trở thành đối tác</p>
              </div>

              <Tabs 
                value={activePartnerTab} 
                onValueChange={(value) => setActivePartnerTab(value as any)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending">
                    <Clock className="w-4 h-4 mr-2" />
                    Chờ duyệt
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Đã duyệt
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    <XCircle className="w-4 h-4 mr-2" />
                    Từ chối
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6">
                  <PartnerList
                    requests={requests.filter(r => r.status === 'pending')}
                    searchQuery=""
                    onViewDetails={handleViewDetails}
                    onApprove={handleApprovePartner}
                    onReject={(company) => {
                      setSelectedCompany(company)
                      setShowRejectDialog(true)
                    }}
                    onToggleFeatured={handleToggleFeatured}
                  />
                </TabsContent>

                <TabsContent value="approved" className="mt-6">
                  <PartnerList
                    requests={requests.filter(r => r.status === 'approved')}
                    searchQuery=""
                    onViewDetails={handleViewDetails}
                    onApprove={handleApprovePartner}
                    onReject={(company) => {
                      setSelectedCompany(company)
                      setShowRejectDialog(true)
                    }}
                    onToggleFeatured={handleToggleFeatured}
                  />
                </TabsContent>

                <TabsContent value="rejected" className="mt-6">
                  <PartnerList
                    requests={requests.filter(r => r.status === 'rejected')}
                    searchQuery=""
                    onViewDetails={handleViewDetails}
                    onApprove={handleApprovePartner}
                    onReject={(company) => {
                      setSelectedCompany(company)
                      setShowRejectDialog(true)
                    }}
                    onToggleFeatured={handleToggleFeatured}
                  />
                </TabsContent>
              </Tabs>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={(newPage) => {
                      loadPartnerRequests(activePartnerTab as any, newPage)
                    }}
                    disabled={isLoadingPartners}
                    variant="simple"
                  />
                </div>
              )}

              {/* Reject Dialog */}
              <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Xác nhận từ chối</DialogTitle>
                    <DialogDescription>
                      Vui lòng nhập lý do từ chối đơn đăng ký của {selectedCompany?.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Nhập lý do từ chối..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRejectDialog(false)
                        setRejectionReason("")
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRejectPartner}
                      disabled={!rejectionReason.trim()}
                    >
                      Xác nhận từ chối
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Partner Detail Dialog */}
              <Dialog open={showDetailDialog} onOpenChange={(open) => {
                setShowDetailDialog(open)
                // Reset tax code info when modal closes
                if (!open && selectedCompany?.taxCode) {
                  setTaxCodeInfo(prev => {
                    const updated = { ...prev }
                    delete updated[selectedCompany.taxCode!]
                    return updated
                  })
                }
              }}>
                <DialogContent 
                  className="max-w-6xl max-h-[90vh] flex flex-col"
                  onWheel={(e) => {
                    e.stopPropagation()
                  }}
                  onTouchMove={(e) => {
                    e.stopPropagation()
                  }}
                >
                  {selectedCompany ? (
                    <>
                      <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="text-2xl">{selectedCompany.name}</DialogTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={
                            `text-sm px-2 py-1 rounded-md ${
                              selectedCompany.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : selectedCompany.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                            }`
                          }>
                            {formatCompanyStatus(selectedCompany.status)}
                          </span>
                          {selectedCompany.taxCode && (
                            <span className="text-sm px-2 py-1 rounded-md border border-gray-300 flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              {selectedCompany.taxCode}
                            </span>
                          )}
                        </div>
                      </DialogHeader>
                      
                      {detailLoading ? (
                        <div className="flex justify-center py-12 flex-shrink-0">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                        </div>
                      ) : (
                        <div 
                          className="space-y-6 py-4 overflow-y-auto flex-1 min-h-0 overscroll-contain"
                          onWheel={(e) => {
                            const target = e.currentTarget
                            const isAtTop = target.scrollTop === 0
                            const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1
                            
                            if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                              e.stopPropagation()
                            }
                          }}
                        >
                          {/* Company Logo */}
                          {selectedCompany.avatarUrl && (
                            <div className="flex justify-center">
                              <img 
                                src={
                                  selectedCompany.avatarUrl.startsWith('http://') || selectedCompany.avatarUrl.startsWith('https://')
                                    ? selectedCompany.avatarUrl
                                    : selectedCompany.avatarUrl.startsWith('/uploads')
                                    ? `${config.api.baseUrl.replace('/api', '')}${selectedCompany.avatarUrl}`
                                    : `${config.api.baseUrl}${selectedCompany.avatarUrl}`
                                }
                                alt={selectedCompany.name}
                                className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                }}
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <h4 className="font-medium">Thông tin liên hệ</h4>
                              <div className="space-y-2 text-sm">
                                {selectedCompany.user && typeof selectedCompany.user !== 'string' && selectedCompany.user.email && (
                                  <p className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    {selectedCompany.user.email}
                                  </p>
                                )}
                                {selectedCompany.phone && (
                                  <p className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    {selectedCompany.phone}
                                  </p>
                                )}
                                {(selectedCompany.ward || selectedCompany.district || selectedCompany.province) && (
                                  <p className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                    <span>{[selectedCompany.ward, selectedCompany.district, selectedCompany.province].filter(Boolean).join(', ')}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h4 className="font-medium">Thông tin doanh nghiệp</h4>
                              <div className="space-y-2 text-sm">
                                {selectedCompany.typeCompany && (
                                  <p className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-gray-500" />
                                    {formatCompanyType(selectedCompany.typeCompany)}
                                  </p>
                                )}
                                {selectedCompany.size && (
                                  <p className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-500" />
                                    {formatCompanySize(selectedCompany.size)}
                                  </p>
                                )}
                                {selectedCompany.workingTime && (
                                  <p className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    {formatWorkingTime(selectedCompany.workingTime)}
                                  </p>
                                )}
                                {selectedCompany.website && (
                                  <p className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-gray-500" />
                                    <a 
                                      href={selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline break-all"
                                    >
                                      {selectedCompany.website}
                                    </a>
                                  </p>
                                )}
                                {selectedCompany.createdAt && (
                                  <p className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    {new Date(selectedCompany.createdAt).toLocaleDateString('vi-VN')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Tax Code Verification */}
                          {selectedCompany.taxCode && (
                            <div className="space-y-2">
                              <div className="space-y-2">
                                <h4 className="font-medium">Xác minh mã số thuế</h4>
                                <Button 
                                  variant="outline" 
                                  className="w-full"
                                  onClick={() => handleVerifyTaxCode(selectedCompany.taxCode!)}
                                  disabled={taxCodeInfo[selectedCompany.taxCode]?.loading}
                                >
                                  {taxCodeInfo[selectedCompany.taxCode]?.loading ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Đang xác minh...
                                    </>
                                  ) : (
                                    <>
                                      <Shield className="w-4 h-4 mr-2" />
                                      Xác minh mã số thuế
                                    </>
                                  )}
                                </Button>
                              </div>
                              
                              {/* Only show verification result if user has clicked verify button */}
                              {taxCodeInfo[selectedCompany.taxCode] && (taxCodeInfo[selectedCompany.taxCode]?.loading || taxCodeInfo[selectedCompany.taxCode]?.error || taxCodeInfo[selectedCompany.taxCode]?.data) && (
                                <div className="mt-4">
                                  {taxCodeInfo[selectedCompany.taxCode]?.loading ? (
                                    <div className="flex items-center justify-center p-4 border rounded-md">
                                      <Loader2 className="w-5 h-5 mr-2 animate-spin text-gray-500" />
                                      <span>Đang xác minh mã số thuế...</span>
                                    </div>
                                  ) : taxCodeInfo[selectedCompany.taxCode]?.error ? (
                                    <Alert variant="destructive">
                                      <AlertCircle className="w-4 h-4" />
                                      <AlertTitle>Lỗi xác minh</AlertTitle>
                                      <AlertDescription>
                                        {taxCodeInfo[selectedCompany.taxCode]?.error}
                                      </AlertDescription>
                                    </Alert>
                                  ) : taxCodeInfo[selectedCompany.taxCode]?.data ? (
                                    <div className="p-4 border rounded-md space-y-2">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span className="font-medium">Đã xác minh</span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <p className="text-gray-600">Tên công ty:</p>
                                        <p>{taxCodeInfo[selectedCompany.taxCode]?.data?.data?.name || 'Không có thông tin'}</p>

                                        <p className="text-gray-600">Địa chỉ:</p>
                                        <p>{taxCodeInfo[selectedCompany.taxCode]?.data?.data?.address || 'Không có thông tin'}</p>

                                        <p className="text-gray-600">Tên quốc tế:</p>
                                        <p>{taxCodeInfo[selectedCompany.taxCode]?.data?.data?.internationalName || 'Không có thông tin'}</p>

                                        <p className="text-gray-600">Trạng thái:</p>
                                        <p>{taxCodeInfo[selectedCompany.taxCode]?.data?.data?.status || 'Không có thông tin'}</p>
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="space-y-2">
                            <h4 className="font-medium">Mô tả doanh nghiệp</h4>
                            <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-md">
                              {selectedCompany.description || 'Không có mô tả'}
                            </div>
                          </div>

                          {selectedCompany.rejectionReason && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-red-600">Lý do từ chối</h4>
                              <div className="text-sm text-red-600 bg-red-50 p-4 rounded-md">
                                {selectedCompany.rejectionReason}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons for Pending Companies */}
                      {selectedCompany && selectedCompany.status === 'pending' && !detailLoading && (
                        <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowDetailDialog(false)
                              setSelectedCompany(selectedCompany)
                              setShowRejectDialog(true)
                            }}
                            className="text-red-600 hover:text-red-700 h-10"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Từ chối
                          </Button>
                          <Button
                            onClick={() => {
                              setShowDetailDialog(false)
                              handleApprovePartner(selectedCompany._id)
                            }}
                            className="bg-green-600 hover:bg-green-700 h-10"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Duyệt đối tác
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      <p>Không tìm thấy thông tin công ty</p>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Users Section */}
          {activeSection === "users" && <UsersSection />}

          {/* Settings Section */}
          {activeSection === "settings" && <SettingsSection />}
        </div>
      </main>
    </div>
  )
}

