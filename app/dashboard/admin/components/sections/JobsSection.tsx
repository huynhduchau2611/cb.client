"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Building2,
  MapPin,
  DollarSign,
  Clock,
  AlertCircle
} from "lucide-react"
import { AdminJobsAPI } from "@/lib/api/admin"
import { Job, formatSalary, formatWorkType, formatJobStatus } from "@/lib/api/jobs"
import { useNotification } from "@/lib/notification-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ConfirmStatusModal } from "@/components/ConfirmStatusModal"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/Pagination"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function JobsSection() {
  const { showSuccess, showError } = useNotification()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Dialog states
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [selectedJobTitle, setSelectedJobTitle] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  useEffect(() => {
    loadJobs()
  }, [page, statusFilter])

  const loadJobs = async () => {
    setLoading(true)
    try {
      const filters: any = {
        page,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      }

      if (statusFilter !== 'all') {
        filters.status = statusFilter
      }

      if (searchTerm) {
        filters.search = searchTerm
      }

      const response = await AdminJobsAPI.getAllJobs(filters)
      setJobs(response.data.posts)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể tải danh sách tin tuyển dụng')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadJobs()
  }

  const openApproveDialog = (jobId: string, jobTitle: string) => {
    setSelectedJobId(jobId)
    setSelectedJobTitle(jobTitle)
    setShowApproveDialog(true)
  }

  const handleApprove = async (reason?: string) => {
    if (!selectedJobId) return

    setActionLoading(true)
    try {
      await AdminJobsAPI.approveJob(selectedJobId)
      showSuccess('Duyệt thành công', `Tin "${selectedJobTitle || 'này'}" đã được duyệt`)
      setShowApproveDialog(false)
      setSelectedJobId(null)
      setSelectedJobTitle(null)
      if (showDetailDialog) {
        setShowDetailDialog(false)
      }
      loadJobs()
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể duyệt tin')
    } finally {
      setActionLoading(false)
    }
  }

  const openRejectDialog = (jobId: string, jobTitle?: string) => {
    setSelectedJobId(jobId)
    setSelectedJobTitle(jobTitle || null)
    setShowRejectDialog(true)
  }

  const openDetailDialog = (job: Job) => {
    setSelectedJob(job)
    setShowDetailDialog(true)
  }

  const handleReject = async (reason?: string) => {
    if (!selectedJobId) return

    setActionLoading(true)
    try {
      await AdminJobsAPI.rejectJob(selectedJobId, reason || '')
      showSuccess('Từ chối thành công', 'Tin tuyển dụng đã bị từ chối')
      setShowRejectDialog(false)
      setSelectedJobId(null)
      setSelectedJobTitle(null)
      if (showDetailDialog) {
        setShowDetailDialog(false)
      }
      loadJobs()
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể từ chối tin')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleFeatured = async (jobId: string) => {
    const job = jobs.find(j => j._id === jobId)
    if (!job) return

    // Check if trying to set as featured and we've reached the limit
    if (!job.isFeatured) {
      const featuredCount = jobs.filter(j => j.isFeatured && j.status === 'approved').length
      if (featuredCount >= 6) {
        showError('Lỗi', 'Tối đa chỉ có 6 việc làm nổi bật')
        return
      }
    }

    // Optimistic update
    setJobs((prevJobs) =>
      prevJobs.map((job) =>
        job._id === jobId ? { ...job, isFeatured: !job.isFeatured } : job
      )
    )

    try {
      await AdminJobsAPI.toggleFeatured(jobId)
      // Don't reload - optimistic update is enough
    } catch (error: any) {
      // Revert on error
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job._id === jobId ? { ...job, isFeatured: !job.isFeatured } : job
        )
      )
      showError('Lỗi', error.message || 'Không thể cập nhật trạng thái nổi bật')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusInfo = formatJobStatus(status)
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý tin tuyển dụng</h1>
        <p className="text-gray-600">Duyệt và quản lý các tin tuyển dụng</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm theo tiêu đề, mô tả..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Tìm kiếm
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách tin tuyển dụng</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Không tìm thấy tin tuyển dụng nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        {getStatusBadge(job.status)}
                      </div>
                      
                      {job.company && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Building2 className="w-4 h-4" />
                          <span>{job.company.name || 'N/A'}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {job.company?.province && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.company.province}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {formatSalary(job.salary)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatWorkType(job.typeWork)}
                        </div>
                      </div>

                      {job.techStack && job.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {job.techStack.map((tech) => (
                            <Badge key={tech} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-2">
                        Đăng ngày: {new Date(job.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openDetailDialog(job)}
                        className="h-9"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Chi Tiết
                      </Button>
                      <div className="flex items-center gap-2 px-1">
                        <Switch
                          id={`featured-${job._id}`}
                          checked={job.isFeatured || false}
                          onCheckedChange={() => handleToggleFeatured(job._id)}
                        />
                        <Label 
                          htmlFor={`featured-${job._id}`}
                          className="text-xs text-gray-600 cursor-pointer"
                        >
                          Nổi bật
                        </Label>
                      </div>
                      {job.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 h-9"
                            onClick={() => openApproveDialog(job._id, job.title)}
                            disabled={actionLoading}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Duyệt
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => openRejectDialog(job._id, job.title)}
                            disabled={actionLoading}
                            className="h-9"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Từ chối
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={loading}
              variant="simple"
            />
          </div>
        </CardContent>
      </Card>

      {/* Job Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] flex flex-col"
          onWheel={(e) => {
            // Prevent scroll propagation to parent when scrolling in dialog
            e.stopPropagation()
          }}
          onTouchMove={(e) => {
            // Prevent touch scroll propagation
            e.stopPropagation()
          }}
        >
          {selectedJob && (
            <>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-2xl">{selectedJob.title}</DialogTitle>
                <DialogDescription>
                  Chi tiết tin tuyển dụng
                </DialogDescription>
              </DialogHeader>

              <div 
                className="space-y-6 py-4 overflow-y-auto flex-1 min-h-0 overscroll-contain"
                onWheel={(e) => {
                  const target = e.currentTarget
                  const isAtTop = target.scrollTop === 0
                  const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1
                  
                  // Prevent scroll propagation when at boundaries
                  if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                    e.stopPropagation()
                  }
                }}
              >
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Trạng thái:</span>
                  <Badge variant={formatJobStatus(selectedJob.status).variant}>
                    {formatJobStatus(selectedJob.status).label}
                  </Badge>
                </div>

                {/* Company Info */}
                {selectedJob.company && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <Building2 className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedJob.company.name || 'N/A'}</p>
                      {selectedJob.company.province && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedJob.company.province}</span>
                        </div>
                      )}
                      {selectedJob.location && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedJob.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Job Details Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Mức lương</p>
                      <p className="font-medium">{formatSalary(selectedJob.salary)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Loại công việc</p>
                      <p className="font-medium">{formatWorkType(selectedJob.typeWork)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Số lượng tuyển</p>
                      <p className="font-medium">{selectedJob.candidateCount} người</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Ngày đăng</p>
                      <p className="font-medium">{new Date(selectedJob.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                </div>

                {/* Tech Stack */}
                {selectedJob.techStack && selectedJob.techStack.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Công nghệ yêu cầu</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.techStack.map((tech) => (
                        <Badge key={tech} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Mô tả công việc</p>
                  <div 
                    className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: selectedJob.description }}
                  />
                </div>

                {/* Rejection Reason (if rejected) */}
                {selectedJob.status === 'rejected' && selectedJob.rejectionReason && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-900 mb-1">Lý do từ chối:</p>
                    <p className="text-sm text-red-700">{selectedJob.rejectionReason}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-shrink-0">
                {selectedJob.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDetailDialog(false)
                        openRejectDialog(selectedJob._id)
                      }}
                      className="text-red-600 hover:text-red-700 h-10"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Từ chối
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDetailDialog(false)
                        openApproveDialog(selectedJob._id, selectedJob.title)
                      }}
                      className="bg-green-600 hover:bg-green-700 h-10"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Duyệt tin này
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Modal */}
      <ConfirmStatusModal
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
        action="approve"
        title="Xác nhận duyệt tin tuyển dụng"
        itemName={selectedJobTitle ? `tin "${selectedJobTitle}"` : "tin này"}
        requireReason={false}
        onConfirm={handleApprove}
        isLoading={actionLoading}
      />

      {/* Reject Confirmation Modal */}
      <ConfirmStatusModal
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        action="reject"
        title="Từ chối tin tuyển dụng"
        itemName={selectedJobTitle ? `tin "${selectedJobTitle}"` : "tin này"}
        requireReason={true}
        reasonLabel="Lý do từ chối"
        reasonPlaceholder="Ví dụ: Nội dung không phù hợp, thiếu thông tin..."
        onConfirm={handleReject}
        isLoading={actionLoading}
      />
    </div>
  )
}
