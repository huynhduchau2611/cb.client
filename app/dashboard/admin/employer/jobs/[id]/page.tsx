"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Trash2, Building2, MapPin, DollarSign, Users, Clock, Briefcase, RefreshCw, FileText, Phone, Mail, Calendar, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useMyJob } from "@/hooks/useJobs"
import { formatSalary, formatWorkType, formatJobStatus } from "@/lib/api/jobs"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useNotification } from "@/lib/notification-context"
import { EmployerJobsAPI } from "@/lib/api/jobs"
import { applicationsApi, Application } from "@/lib/api/applications"
import { ApplicationStatusTable } from "@/components/ApplicationStatusTable"
import { cn } from "@/lib/utils"

function JobDetailContent() {
  const params = useParams()
  const router = useRouter()
  const { showSuccess, showError } = useNotification()
  const jobId = params.id as string

  const { job, loading, error, fetchJob } = useMyJob()
  const [applications, setApplications] = useState<Application[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [applicationsError, setApplicationsError] = useState<string | null>(null)

  const loadApplications = useCallback(async () => {
    if (!jobId) return

    setApplicationsLoading(true)
    setApplicationsError(null)
    try {
      const result = await applicationsApi.getJobApplications(jobId, { limit: 100 })
      setApplications(result.applications)
    } catch (err: any) {
      const message = err?.message || "Không thể tải danh sách ứng viên"
      setApplicationsError(message)
      showError("Lỗi", message)
    } finally {
      setApplicationsLoading(false)
    }
  }, [jobId, showError])

  useEffect(() => {
    if (jobId) {
      fetchJob(jobId)
    }
  }, [jobId, fetchJob])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  const handleStatusChange = async (applicationId: string, status: Application["status"]) => {
    try {
      await applicationsApi.updateApplicationStatus(applicationId, status)
      setApplications((prev) =>
        prev.map((application) =>
          application._id === applicationId ? { ...application, status } : application,
        ),
      )
      showSuccess("Cập nhật thành công", "Trạng thái ứng viên đã được cập nhật")
    } catch (err: any) {
      showError("Lỗi", err?.message || "Không thể cập nhật trạng thái")
    }
  }


  const handleDelete = async () => {
    if (!job) return
    
    if (!confirm(`Bạn có chắc muốn xóa tin "${job.title}"?`)) {
      return
    }

    try {
      await EmployerJobsAPI.deleteJob(job._id)
      showSuccess('Xóa thành công', 'Tin tuyển dụng đã được xóa')
      router.push('/dashboard/employer')
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể xóa tin tuyển dụng')
    }
  }

  const handleToggleVisibility = async () => {
    if (!job) return

    try {
      const response = await EmployerJobsAPI.updateJobVisibility(job._id, !job.isHidden)
      showSuccess('Thành công', response.data.message || (!job.isHidden ? 'Tin đã được ẩn khỏi ứng viên.' : 'Tin đã được hiển thị trở lại.'))
      await fetchJob(job._id)
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể cập nhật hiển thị của tin tuyển dụng')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="py-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-600 mb-4">{error || 'Không tìm thấy tin tuyển dụng'}</p>
              <Button asChild variant="outline">
                <Link href="/dashboard/employer">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const statusInfo = formatJobStatus(job.status)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/employer">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Link>
          </Button>
        </div>

        {/* Job Title Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl">{job.title}</CardTitle>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  {job.isHidden && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                      Đang ẩn
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-base">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {job.company.name}
                    {job.isHidden && (
                      <span className="text-gray-500 text-sm">
                        • Tin đang ẩn với ứng viên
                      </span>
                    )}
                  </div>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {job.status === "approved" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "gap-1",
                      job.isHidden
                        ? "text-green-600 hover:text-green-700"
                        : "text-gray-700 hover:text-gray-900"
                    )}
                    onClick={handleToggleVisibility}
                  >
                    {job.isHidden ? (
                      <>
                        <Eye className="w-4 h-4" />
                        Hiển thị tin
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Ẩn tin
                      </>
                    )}
                  </Button>
                )}
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Job Info Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Mức lương</p>
                  <p className="font-semibold">{formatSalary(job.salary)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Loại hình</p>
                  <p className="font-semibold">{formatWorkType(job.typeWork)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Số lượng tuyển</p>
                  <p className="font-semibold">{job.candidateCount} người</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Địa điểm</p>
                  <p className="font-semibold">{job.company.province}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tech Stack */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Công nghệ & Kỹ năng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {job.techStack.map((tech) => (
                <Badge key={tech} variant="secondary">{tech}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mô tả công việc</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-gray-700">{job.description}</p>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thống kê</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Đã ứng tuyển</p>
                <p className="text-2xl font-bold text-blue-600">{job.candidateApplied}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày đăng</p>
                <p className="font-semibold">{new Date(job.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cập nhật</p>
                <p className="font-semibold">{new Date(job.updatedAt).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Status Table */}
        {applicationsError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-600 mb-4">{applicationsError}</p>
              <Button variant="outline" onClick={loadApplications}>
                Thử lại
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ApplicationStatusTable
            applications={applications}
            loading={applicationsLoading}
            onStatusChange={handleStatusChange}
            onRefresh={loadApplications}
          />
        )}
      </div>
    </div>
  )
}

export default function JobDetailPage() {
  return (
    <ProtectedRoute allowedRoles={["employer"]}>
      <JobDetailContent />
    </ProtectedRoute>
  )
}

