"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Briefcase,
  FileText,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  Clock,
  LayoutDashboard,
  Settings,
  Building2,
  Loader2,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Users,
  Globe,
  MapPin,
  Upload,
  X,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useNotification } from "@/lib/notification-context"
import { partnerApi, Company } from "@/lib/api/partner"
import { EmployerJobsAPI, Job, formatSalary, formatWorkType, formatJobStatus, isJobExpired, getDaysRemaining, formatCompanyType, formatCompanyStatus, formatCompanySize, formatWorkingTime } from "@/lib/api/jobs"
import { applicationsApi, Application, formatApplicationStatus } from "@/lib/api/applications"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Info } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ProvincesAPI, { Province, District, Ward } from "@/lib/api/provinces"
import { config } from "@/lib/config"
import Image from "next/image"

export function EmployerDashboardContent() {
  const router = useRouter()
  const { showSuccess, showError } = useNotification()
  const [activeSection, setActiveSection] = useState("overview")

  // Company info
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoadingCompany, setIsLoadingCompany] = useState(true)

  // Jobs data
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  
  // Stats data
  const [stats, setStats] = useState<any>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Applications data
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(true)
  const [applicationsError, setApplicationsError] = useState<string | null>(null)
  
  // Modal state
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  
  // Company edit state
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false)
  const [isUpdatingCompany, setIsUpdatingCompany] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<Company>>({})
  
  // Location data for edit form
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)
  
  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadAllData()
  }, [])

  // Load provinces when edit dialog opens
  useEffect(() => {
    if (isEditCompanyOpen) {
      loadProvinces()
      // If company has location data, load districts and wards
      if (editFormData.provinceCode) {
        loadDistricts(parseInt(editFormData.provinceCode))
      }
      if (editFormData.districtCode) {
        loadWards(parseInt(editFormData.districtCode))
      }
    }
  }, [isEditCompanyOpen])

  const loadProvinces = async () => {
    setLoadingProvinces(true)
    try {
      const data = await ProvincesAPI.getProvinces()
      setProvinces(data)
    } catch (error) {
      showError("Lỗi", "Không thể tải danh sách tỉnh thành")
    } finally {
      setLoadingProvinces(false)
    }
  }

  const loadDistricts = async (provinceCode: number) => {
    setLoadingDistricts(true)
    try {
      const data = await ProvincesAPI.getDistrictsByProvince(provinceCode)
      setDistricts(data)
      setWards([])
    } catch (error) {
      showError("Lỗi", "Không thể tải danh sách quận/huyện")
    } finally {
      setLoadingDistricts(false)
    }
  }

  const loadWards = async (districtCode: number) => {
    setLoadingWards(true)
    try {
      const data = await ProvincesAPI.getWardsByDistrict(districtCode)
      setWards(data)
    } catch (error) {
      showError("Lỗi", "Không thể tải danh sách phường/xã")
    } finally {
      setLoadingWards(false)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        showError("Lỗi", "Chỉ chấp nhận file ảnh: JPEG, PNG, GIF, WebP")
        e.target.value = ""
        return
      }
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        showError("Lỗi", "Kích thước file không được vượt quá 2MB")
        e.target.value = ""
        return
      }
      setAvatarFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdateCompany = async () => {
    if (!company) return

    setIsUpdatingCompany(true)
    try {
      // Upload avatar first if there's a file
      if (avatarFile) {
        const uploadResult = await partnerApi.uploadCompanyAvatar(avatarFile)
        editFormData.avatarUrl = uploadResult.avatarUrl
        setCompany(uploadResult.company)
      }
      
      // Update company profile (always update to sync all fields)
      const result = await partnerApi.updateMyCompany(editFormData)
      setCompany(result.company)
      
      // Reload company data to ensure we have the latest from server
      await loadCompany()
      
      // Reset avatar state
      setAvatarFile(null)
      setAvatarPreview('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      showSuccess("Thành công", "Cập nhật thông tin công ty thành công")
      setIsEditCompanyOpen(false)
    } catch (error: any) {
      showError("Lỗi", error.message || "Không thể cập nhật thông tin công ty")
    } finally {
      setIsUpdatingCompany(false)
    }
  }

  const loadAllData = async () => {
    await Promise.all([
      loadCompany(),
      loadJobs(),
      loadStats(),
      loadApplications(),
    ])
  }

  const loadCompany = async () => {
    setIsLoadingCompany(true)
    try {
      const data = await partnerApi.getMyCompany()
      setCompany(data)
    } catch (error: any) {
      if (error.message && !error.message.includes('Company not found')) {
        showError('Lỗi', error.message || 'Không thể tải thông tin công ty')
      }
    } finally {
      setIsLoadingCompany(false)
    }
  }

  const loadJobs = async () => {
    setIsLoadingJobs(true)
    try {
      const response = await EmployerJobsAPI.getMyJobs({ limit: 100 })
      setJobs(response.data.posts)
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể tải danh sách tin tuyển dụng')
    } finally {
      setIsLoadingJobs(false)
    }
  }

  const loadStats = async () => {
    setIsLoadingStats(true)
    try {
      const response = await EmployerJobsAPI.getMyJobStats()
      setStats(response.data)
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể tải thống kê')
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (!confirm(`Bạn có chắc muốn xóa tin "${jobTitle}"?`)) {
      return
    }

    try {
      await EmployerJobsAPI.deleteJob(jobId)
      showSuccess('Xóa thành công', 'Tin tuyển dụng đã được xóa')
      // Reload data
      await loadJobs()
      await loadStats()
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể xóa tin tuyển dụng')
    }
  }

  const handleToggleJobVisibility = async (jobId: string, jobTitle: string, currentHidden: boolean) => {
    try {
      const response = await EmployerJobsAPI.updateJobVisibility(jobId, !currentHidden)
      const updatedPost = response.data.post

      setJobs((prev) =>
        prev.map((job) => (job._id === jobId ? { ...job, ...updatedPost } : job)),
      )

      showSuccess('Thành công', (!currentHidden
        ? `Tin "${jobTitle}" đã được ẩn khỏi ứng viên.`
        : `Tin "${jobTitle}" đã được hiển thị cho ứng viên.`))
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể cập nhật hiển thị của tin tuyển dụng')
    }
  }

  const loadApplications = async () => {
    setIsLoadingApplications(true)
    setApplicationsError(null)
    try {
      const result = await applicationsApi.getMyJobApplications({ limit: 200 })
      setApplications(result.applications)
    } catch (error: any) {
      const message = error?.message || 'Không thể tải danh sách ứng viên'
      setApplicationsError(message)
      showError('Lỗi', message)
    } finally {
      setIsLoadingApplications(false)
    }
  }

  const handleApplicationStatusChange = async (applicationId: string, status: Application["status"]) => {
    try {
      await applicationsApi.updateApplicationStatus(applicationId, status)
      setApplications((prev) =>
        prev.map((application) =>
          application._id === applicationId ? { ...application, status } : application
        )
      )
      showSuccess('Cập nhật thành công', 'Trạng thái ứng viên đã được cập nhật')
    } catch (error: any) {
      showError('Lỗi', error?.message || 'Không thể cập nhật trạng thái ứng viên')
    }
  }

  const pendingJobs = jobs.filter((job) => job.status === "pending")
  const approvedJobs = jobs.filter((job) => job.status === "approved")
  // Simplified status options - only 4 main statuses
  const APPLICATION_STATUS_OPTIONS: Application["status"][] = [
    "applied",      // Đã nộp
    "interviewed",  // Đã phỏng vấn
    "hired",        // Đã duyệt
    "rejected",     // Đã từ chối
  ]
  const totalApplications = applications.length
  const applicationStatusSummary = APPLICATION_STATUS_OPTIONS.map((status) => ({
    status,
    count: applications.filter((application) => application.status === status).length,
    info: formatApplicationStatus(status),
  })).filter((item) => item.count > 0)

  const menuItems = [
    { id: "overview", label: "Tổng Quan", icon: LayoutDashboard },
    { id: "jobs", label: "Tin Tuyển Dụng", icon: Briefcase, badge: jobs.length },
    { id: "applications", label: "Ứng Viên", icon: FileText, badge: applications.length },
    { id: "settings", label: "Cài Đặt", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r min-h-screen sticky top-0">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Nhà Tuyển Dụng</h2>
          <p className="text-sm text-gray-600 mt-1">Quản lý tuyển dụng</p>
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
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge
                    className={cn(
                      "ml-auto",
                      activeSection === item.id ? "bg-white text-blue-600" : "bg-blue-600 text-white",
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>

        {/* Quick Action */}
        <div className="p-4 border-t mt-auto">
          {stats && stats.stats.remainingPosts > 0 ? (
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
              <Link href="/dashboard/employer/post-job">
                <Plus className="w-4 h-4 mr-2" />
                Đăng Tin Mới
              </Link>
            </Button>
          ) : (
            <Button disabled className="w-full">
              <AlertCircle className="w-4 h-4 mr-2" />
              Đã hết quota
            </Button>
          )}
        </div>
      </aside>

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Overview Section */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Tổng Quan</h1>
                  <p className="text-gray-600">Thống kê hoạt động tuyển dụng</p>
                </div>
                {stats && stats.stats.remainingPosts > 0 && (
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/dashboard/employer/post-job">
                      <Plus className="w-5 h-5 mr-2" />
                      Đăng Tin Mới
                    </Link>
                  </Button>
                )}
              </div>

              {/* Plan Info Card */}
              {isLoadingStats ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                      <div>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                      <div>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : stats && stats.plan ? (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Gói Đăng Ký: {stats.plan.name}
                    </CardTitle>
                    <CardDescription>Thông tin gói đăng ký hiện tại</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Tin đã dùng</p>
                        <p className="text-2xl font-bold">{stats.stats.activePosts} / {stats.plan.maxPosts}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tin còn lại</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.stats.remainingPosts}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Thời hạn tin</p>
                        <p className="text-2xl font-bold">{stats.plan.postDuration} ngày</p>
                      </div>
                    </div>
                    {stats.stats.remainingPosts === 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-900">Đã đạt giới hạn</p>
                          <p className="text-sm text-yellow-700">Bạn đã sử dụng hết số tin đăng. Vui lòng nâng cấp gói để đăng thêm.</p>
                          <Button asChild size="sm" className="mt-2">
                            <Link href="/pricing">Nâng cấp gói</Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardContent className="py-8 text-center">
                    <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                    <p className="font-medium text-yellow-900 mb-2">Chưa có gói đăng ký</p>
                    <p className="text-sm text-yellow-700 mb-4">Bạn cần mua gói đăng ký để đăng tin tuyển dụng</p>
                    <Button asChild>
                      <Link href="/pricing">Xem gói đăng ký</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Stats Cards */}
              <div className="grid md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Tổng Tin</CardTitle>
                    <Briefcase className="w-4 h-4 text-gray-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.stats.totalPosts || 0}</div>
                    <p className="text-xs text-gray-600 mt-1">Tất cả tin đã đăng</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Đang Hiển Thị</CardTitle>
                    <Eye className="w-4 h-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats?.stats.approvedPosts || 0}</div>
                    <p className="text-xs text-gray-600 mt-1">Tin đã được duyệt</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Chờ Duyệt</CardTitle>
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats?.stats.pendingPosts || 0}</div>
                    <p className="text-xs text-gray-600 mt-1">Đang chờ admin</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Từ Chối</CardTitle>
                    <FileText className="w-4 h-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats?.stats.rejectedPosts || 0}</div>
                    <p className="text-xs text-gray-600 mt-1">Tin bị từ chối</p>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Jobs Alert */}
              {pendingJobs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      Tin Chờ Duyệt ({pendingJobs.length})
                    </CardTitle>
                    <CardDescription>Các tin tuyển dụng đang chờ admin phê duyệt</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingJobs.map((job) => (
                        <div key={job._id} className="flex items-center justify-between border-b pb-3 last:border-0">
                          <div>
                            <p className="font-medium">{job.title}</p>
                            <p className="text-sm text-gray-600">
                              Đăng ngày {new Date(job.createdAt).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="w-3 h-3" />
                            Chờ duyệt
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Company Info Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Thông Tin Công Ty</CardTitle>
                      <CardDescription>Thông tin công ty liên kết với tài khoản nhà tuyển dụng</CardDescription>
                    </div>
                    {company && company.status === 'approved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditFormData({
                            name: company.name,
                            avatarUrl: company.avatarUrl,
                            phone: company.phone,
                            workingTime: company.workingTime,
                            size: company.size,
                            typeCompany: company.typeCompany,
                            provinceCode: company.provinceCode,
                            province: company.province,
                            districtCode: company.districtCode,
                            district: company.district,
                            wardCode: company.wardCode,
                            ward: company.ward,
                            description: company.description,
                            website: company.website,
                          })
                          setAvatarFile(null)
                          setAvatarPreview('')
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                          setIsEditCompanyOpen(true)
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Chỉnh sửa
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingCompany ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <Skeleton className="w-24 h-24 rounded-full" />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-5 w-3/4" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-5 w-3/4" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-5 w-3/4" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-5 w-3/4" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-5 w-3/4" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-5 w-3/4" />
                        </div>
                      </div>
                    </div>
                  ) : !company ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <Building2 className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="font-medium">Chưa có thông tin công ty</p>
                      <p className="text-sm text-gray-600">Bạn chưa gửi đăng ký trở thành đối tác.</p>
                      <div className="pt-2">
                        <Button asChild className="bg-blue-600 hover:bg-blue-700">
                          <Link href="/dashboard/partner/apply">Đăng ký ngay</Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Company Header with Avatar */}
                      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b">
                        <div className="relative group">
                          <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-gray-200 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                            {company.avatarUrl ? (
                              <img 
                                src={
                                  company.avatarUrl.startsWith('http://') || company.avatarUrl.startsWith('https://')
                                    ? company.avatarUrl
                                    : company.avatarUrl.startsWith('/uploads')
                                    ? `${config.api.baseUrl.replace('/api', '')}${company.avatarUrl}`
                                    : `${config.api.baseUrl}${company.avatarUrl}`
                                }
                                alt={company.name} 
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder-logo.png'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                                <Building2 className="w-16 h-16 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{company.name}</h3>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-600">
                            {company.status && (
                              <Badge className={
                                company.status === 'approved' 
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : company.status === 'pending'
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                  : "bg-red-100 text-red-700 border-red-200"
                              }>
                                {formatCompanyStatus(company.status)}
                              </Badge>
                            )}
                            {company.plan && (
                              <Badge variant="outline" className="border-blue-200 text-blue-700">
                                {typeof company.plan === 'object' ? company.plan.name : 'Plan'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Company Details Grid */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tên Công Ty</p>
                          <p className="text-base font-semibold text-gray-900">{company.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mã Số Thuế</p>
                          <p className="text-base font-mono font-semibold text-gray-900">{company.taxCode}</p>
                        </div>
                        {company.phone && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Số Điện Thoại</p>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <p className="text-base font-medium text-gray-900">{company.phone}</p>
                            </div>
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lĩnh Vực</p>
                          <p className="text-base font-medium text-gray-900">{formatCompanyType(company.typeCompany)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quy Mô</p>
                          <p className="text-base font-medium text-gray-900">{formatCompanySize(company.size)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Thời Gian Làm Việc</p>
                          <p className="text-base font-medium text-gray-900">
                            {formatWorkingTime(company.workingTime)}
                          </p>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Địa Chỉ</p>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                            <p className="text-base font-medium text-gray-900">
                              {[company.ward, company.district, company.province].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        </div>
                        {company.website && (
                          <div className="space-y-1 md:col-span-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Website</p>
                            <a 
                              href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-blue-600 hover:text-blue-700 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <Globe className="w-4 h-4" />
                              {company.website}
                            </a>
                          </div>
                        )}
                      </div>

                      {company.description && (
                        <div className="pt-4 border-t">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Giới Thiệu</p>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{company.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Jobs Section */}
          {activeSection === "jobs" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Tin Tuyển Dụng</h1>
                  <p className="text-gray-600">Quản lý các tin tuyển dụng của bạn</p>
                </div>
                {stats && stats.stats.remainingPosts > 0 && (
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/dashboard/employer/post-job">
                      <Plus className="w-5 h-5 mr-2" />
                      Đăng Tin Mới
                    </Link>
                  </Button>
                )}
              </div>

              {isLoadingJobs ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-6 w-3/4" />
                            <div className="flex gap-2">
                              <Skeleton className="h-5 w-20" />
                              <Skeleton className="h-5 w-16" />
                            </div>
                          </div>
                          <Skeleton className="h-6 w-24" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-5/6" />
                          <div className="flex gap-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-6 w-16" />
                          </div>
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-20" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <Briefcase className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium mb-1">Chưa có tin tuyển dụng nào</p>
                      <p className="text-sm text-gray-600">Bắt đầu đăng tin để tìm ứng viên phù hợp</p>
                    </div>
                    {stats && stats.stats.remainingPosts > 0 && (
                      <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <Link href="/dashboard/employer/post-job">Đăng Tin Đầu Tiên</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => {
                    const statusInfo = formatJobStatus(job.status)
                    const isHidden = Boolean(job.isHidden)
                    // Check if job is expired (only for approved jobs)
                    const postDuration = stats?.plan?.postDuration || 0
                    const jobExpired = job.status === 'approved' && postDuration > 0 
                      ? isJobExpired(job.createdAt, postDuration) 
                      : job.status === 'expired'
                    const daysRemaining = job.status === 'approved' && postDuration > 0 && !jobExpired
                      ? getDaysRemaining(job.createdAt, postDuration)
                      : null
                    
                    return (
                      <Card key={job._id}>
                        <CardHeader>
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <CardTitle className="text-xl">{job.title}</CardTitle>
                                <Badge variant={statusInfo.variant}>
                                  {statusInfo.label}
                                </Badge>
                                {isHidden && (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                                    Đang ẩn
                                  </Badge>
                                )}
                                {/* Badge hiển thị trạng thái hết hạn/còn hạn */}
                                {job.status === 'approved' && postDuration > 0 && (
                                  <>
                                    {jobExpired ? (
                                      <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                                        Hết hạn
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                        Còn hạn {daysRemaining !== null && daysRemaining > 0 ? `(${daysRemaining} ngày)` : ''}
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </div>
                              <CardDescription>
                                {job.company.province} • {formatSalary(job.salary)} • {formatWorkType(job.typeWork)}
                                {isHidden && (
                                  <span className="ml-2 text-gray-500">
                                    (Tin đang ẩn với ứng viên)
                                  </span>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              {job.techStack.map((tech) => (
                                <Badge key={tech} variant="outline">{tech}</Badge>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span>📅 Đăng: {new Date(job.createdAt).toLocaleDateString("vi-VN")}</span>
                              {job.status === 'approved' && postDuration > 0 && (
                                <span>
                                  {jobExpired ? (
                                    <span className="text-gray-500">⏰ Hết hạn</span>
                                  ) : (
                                    <span className="text-green-600">⏰ Còn {daysRemaining !== null && daysRemaining > 0 ? `${daysRemaining} ngày` : 'hạn'}</span>
                                  )}
                                </span>
                              )}
                              <span>👥 Tuyển: {job.candidateCount} người</span>
                              <span>📝 Đã ứng tuyển: {job.candidateApplied}</span>
                            </div>
                            <div className="flex gap-2">
                              {job.status === 'approved' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "gap-1",
                                    isHidden
                                      ? "text-green-600 hover:text-green-700"
                                      : "text-gray-700 hover:text-gray-900"
                                  )}
                                  onClick={() => handleToggleJobVisibility(job._id, job.title, isHidden)}
                                >
                                  {isHidden ? (
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
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/dashboard/employer/jobs/${job._id}`}>Xem Tin</Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-red-600 hover:text-red-700 bg-transparent"
                                onClick={() => handleDeleteJob(job._id, job.title)}
                              >
                                <Trash2 className="w-4 h-4" />
                                Xóa
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Applications Section */}
          {activeSection === "applications" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Ứng Viên</h1>
                  <p className="text-gray-600">Theo dõi và xử lý hồ sơ ứng tuyển từ tất cả tin tuyển dụng</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={loadApplications}
                    disabled={isLoadingApplications}
                    className="gap-2"
                  >
                    <RefreshCw className={cn("w-4 h-4", isLoadingApplications && "animate-spin")} />
                    Tải lại
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Tổng ứng viên</CardTitle>
                    <Users className="w-4 h-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{totalApplications}</div>
                    <p className="text-xs text-gray-600 mt-1">Tất cả hồ sơ đã nhận</p>
                  </CardContent>
                </Card>

                {applicationStatusSummary.length === 0 && (
                  <Card>
                    <CardContent className="py-6 text-sm text-muted-foreground">
                      Chưa có dữ liệu trạng thái ứng viên.
                    </CardContent>
                  </Card>
                )}

                {applicationStatusSummary.map(({ status, count, info }) => (
                  <Card key={status}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">{info.label}</CardTitle>
                      <Badge variant={info.variant}>{count}</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-600">
                        {status === "applied" && "Vừa gửi hồ sơ"}
                        {status === "reviewing" && "Đang xem xét"}
                        {status === "shortlisted" && "Đã vào vòng tiếp theo"}
                        {status === "interviewed" && "Đã phỏng vấn"}
                        {status === "hired" && "Đã tuyển dụng"}
                        {status === "rejected" && "Đã từ chối"}
                        {status === "withdrawn" && "Ứng viên đã rút"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {isLoadingApplications ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-8 w-32" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-20 w-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : applicationsError ? (
                <Card>
                  <CardContent className="py-8 text-center text-red-600">
                    {applicationsError}
                  </CardContent>
                </Card>
              ) : applications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center space-y-4 text-muted-foreground">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Chưa có ứng viên</p>
                      <p className="text-sm">Khi ứng viên nộp hồ sơ, bạn sẽ thấy thông tin tại đây.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => {
                    const statusInfo = formatApplicationStatus(application.status)
                    const applicantName = application.user?.fullName ?? "Ứng viên ẩn danh"
                    const initials = applicantName
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)

                    const jobTitle = application.post?.title ?? "Tin tuyển dụng không xác định"
                    const companyName = application.post?.company?.name
                    const jobId = application.post?._id

                    // Map status for display
                    const displayStatus = (() => {
                      if (application.status === "reviewing" || application.status === "shortlisted") {
                        return "applied"
                      }
                      if (application.status === "withdrawn") {
                        return "rejected"
                      }
                      return application.status
                    })()

                    const statusLabels: Record<string, string> = {
                      applied: "Đã nộp",
                      interviewed: "Đã phỏng vấn",
                      hired: "Đã duyệt",
                      rejected: "Đã từ chối",
                    }

                    const statusColors: Record<string, string> = {
                      applied: "bg-blue-100 text-blue-800 border-blue-300",
                      interviewed: "bg-orange-100 text-orange-800 border-orange-300",
                      hired: "bg-green-100 text-green-800 border-green-300",
                      rejected: "bg-red-100 text-red-800 border-red-300",
                    }

                    return (
                      <Card key={application._id} className="border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row gap-6">
                            {/* Left Section - Applicant Info */}
                            <div className="flex-1 space-y-4">
                              <div className="flex items-start gap-4">
                                <Avatar className="h-16 w-16 border-2 border-gray-200">
                                  <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700">
                                    {initials || "UV"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-xl font-bold text-gray-900">{applicantName}</h3>
                                    <Badge 
                                      className={cn(
                                        "border-2 font-medium",
                                        statusColors[displayStatus] || "bg-gray-100 text-gray-800 border-gray-300"
                                      )}
                                    >
                                      {statusLabels[displayStatus] || statusInfo.label}
                                    </Badge>
                                    <Badge variant="outline" className="bg-gray-50">
                                      {application.type === "cv" ? "📄 CV" : "📝 Form"}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Calendar className="w-4 h-4 text-gray-400" />
                                      <span>Nộp: {new Date(application.createdAt).toLocaleString("vi-VN", { 
                                        day: "2-digit", 
                                        month: "2-digit", 
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      })}</span>
                                    </div>
                                    {application.user?.email && (
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span className="truncate">{application.user.email}</span>
                                      </div>
                                    )}
                                    {(application.formData?.phone || application.user?.phone) && (
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{application.formData?.phone || application.user?.phone}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Briefcase className="w-4 h-4 text-gray-400" />
                                      <span className="truncate">
                                        {jobTitle}
                                        {companyName && <span className="text-xs text-gray-500 ml-1">• {companyName}</span>}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right Section - Actions */}
                            <div className="flex flex-col gap-4 lg:w-64">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                                <Select
                                  value={displayStatus}
                                  onValueChange={(value) => {
                                    let backendStatus = value as Application["status"]
                                    handleApplicationStatusChange(application._id, backendStatus)
                                  }}
                                >
                                  <SelectTrigger className={cn(
                                    "w-full border-2 font-medium",
                                    statusColors[displayStatus] || "bg-gray-100 text-gray-800 border-gray-300"
                                  )}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {APPLICATION_STATUS_OPTIONS.map((status) => (
                                      <SelectItem key={status} value={status}>
                                        {statusLabels[status] || status}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full gap-2"
                                  onClick={() => {
                                    setSelectedApplication(application)
                                    setIsDetailModalOpen(true)
                                  }}
                                >
                                  <Info className="w-4 h-4" />
                                  Xem chi tiết
                                </Button>
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="w-full gap-2"
                                >
                                  <Link href={jobId ? `/dashboard/employer/jobs/${jobId}` : "/dashboard/employer/jobs"}>
                                    <Eye className="w-4 h-4" />
                                    Xem tin tuyển dụng
                                  </Link>
                                </Button>
                                {application.cvUrl && (
                                  <Button 
                                    asChild 
                                    variant="secondary" 
                                    size="sm" 
                                    className="w-full gap-2"
                                  >
                                    <a href={application.cvUrl} target="_blank" rel="noopener noreferrer">
                                      <FileText className="w-4 h-4" />
                                      Tải CV
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Settings Section */}
          {activeSection === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Cài Đặt</h1>
                <p className="text-gray-600">Quản lý thông tin tài khoản</p>
              </div>

              <Card>
                <CardContent className="py-12 text-center">
                  <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Tính năng cài đặt đang được phát triển</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Application Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-gray-200">
                    <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700">
                      {selectedApplication.user?.fullName
                        ?.split(" ")
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "UV"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xl font-bold">
                      {selectedApplication.user?.fullName ?? "Ứng viên ẩn danh"}
                    </div>
                    <div className="text-sm text-gray-500 font-normal">
                      {selectedApplication.post?.title ?? "Tin tuyển dụng không xác định"}
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  Thông tin chi tiết hồ sơ ứng tuyển
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Contact Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Thông tin liên hệ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    {selectedApplication.user?.email && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        <p className="font-medium">{selectedApplication.user.email}</p>
                      </div>
                    )}
                    {(selectedApplication.formData?.phone || selectedApplication.user?.phone) && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
                        <p className="font-medium">
                          {selectedApplication.formData?.phone || selectedApplication.user?.phone}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Ngày nộp hồ sơ</p>
                      <p className="font-medium">
                        {new Date(selectedApplication.createdAt).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Loại đơn</p>
                      <Badge variant="outline">
                        {selectedApplication.type === "cv" ? "📄 Nộp CV" : "📝 Điền Form"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* CV or Form Data */}
                {selectedApplication.cvUrl ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      CV đã tải lên
                    </h3>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">CV của ứng viên</p>
                            <p className="text-sm text-gray-500">Nhấp vào link để xem hoặc tải CV</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <a
                              href={selectedApplication.cvUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="w-4 h-4" />
                              Xem CV
                            </a>
                          </Button>
                          <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="gap-2"
                          >
                            <a
                              href={selectedApplication.cvUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileText className="w-4 h-4" />
                              Tải CV
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Thông tin ứng tuyển
                    </h3>
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Kỹ năng</p>
                        <p className="text-gray-600 whitespace-pre-wrap">
                          {selectedApplication.formData?.skills || "Không có thông tin"}
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Kinh nghiệm</p>
                        <p className="text-gray-600 whitespace-pre-wrap">
                          {selectedApplication.formData?.experience || "Không có thông tin"}
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Thời gian có thể làm việc</p>
                        <p className="text-gray-600 whitespace-pre-wrap">
                          {selectedApplication.formData?.availability || "Không có thông tin"}
                        </p>
                      </div>
                      {selectedApplication.formData?.additionalInfo && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Thông tin bổ sung</p>
                            <p className="text-gray-600 whitespace-pre-wrap">
                              {selectedApplication.formData.additionalInfo}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Job Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Tin tuyển dụng
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900 mb-1">
                      {selectedApplication.post?.title ?? "Tin tuyển dụng không xác định"}
                    </p>
                    {selectedApplication.post?.company?.name && (
                      <p className="text-sm text-gray-600">
                        {selectedApplication.post.company.name}
                      </p>
                    )}
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-2"
                    >
                      <Link
                        href={selectedApplication.post?._id ? `/dashboard/employer/jobs/${selectedApplication.post._id}` : "/dashboard/employer/jobs"}
                        onClick={() => setIsDetailModalOpen(false)}
                      >
                        <Eye className="w-4 h-4" />
                        Xem tin tuyển dụng
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={isEditCompanyOpen} onOpenChange={setIsEditCompanyOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Thông Tin Công Ty</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin công ty của bạn. Mã số thuế không thể thay đổi.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Tên Công Ty *</Label>
                <Input
                  id="name"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Nhập tên công ty"
                  className="h-10"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Số Điện Thoại</Label>
                <Input
                  id="phone"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="Nhập số điện thoại"
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="typeCompany" className="text-sm font-medium">Lĩnh Vực *</Label>
                <Select
                  value={editFormData.typeCompany || ''}
                  onValueChange={(value) => setEditFormData({ ...editFormData, typeCompany: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Chọn lĩnh vực" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Công nghệ</SelectItem>
                    <SelectItem value="finance">Tài chính</SelectItem>
                    <SelectItem value="healthcare">Y tế</SelectItem>
                    <SelectItem value="education">Giáo dục</SelectItem>
                    <SelectItem value="retail">Bán lẻ</SelectItem>
                    <SelectItem value="manufacturing">Sản xuất</SelectItem>
                    <SelectItem value="consulting">Tư vấn</SelectItem>
                    <SelectItem value="media">Truyền thông</SelectItem>
                    <SelectItem value="real-estate">Bất động sản</SelectItem>
                    <SelectItem value="transportation">Vận tải</SelectItem>
                    <SelectItem value="energy">Năng lượng</SelectItem>
                    <SelectItem value="government">Chính phủ</SelectItem>
                    <SelectItem value="non-profit">Phi lợi nhuận</SelectItem>
                    <SelectItem value="startup">Khởi nghiệp</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size" className="text-sm font-medium">Quy Mô *</Label>
                <Select
                  value={editFormData.size || ''}
                  onValueChange={(value) => setEditFormData({ ...editFormData, size: value as any })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Chọn quy mô" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-50">1-50 nhân viên</SelectItem>
                    <SelectItem value="51-200">51-200 nhân viên</SelectItem>
                    <SelectItem value="201-500">201-500 nhân viên</SelectItem>
                    <SelectItem value="501-1000">501-1000 nhân viên</SelectItem>
                    <SelectItem value="1000+">Trên 1000 nhân viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workingTime" className="text-sm font-medium">Thời Gian Làm Việc *</Label>
              <Select
                value={editFormData.workingTime || ''}
                onValueChange={(value) => setEditFormData({ ...editFormData, workingTime: value as any })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Chọn thời gian làm việc" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday-to-friday">Thứ 2 - Thứ 6</SelectItem>
                  <SelectItem value="monday-to-saturday">Thứ 2 - Thứ 7</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="province" className="text-sm font-medium">Tỉnh/Thành Phố *</Label>
                <Select
                  value={editFormData.provinceCode || ''}
                  onValueChange={(value) => {
                    const selectedProvince = provinces.find(p => p.code.toString() === value)
                    setEditFormData({
                      ...editFormData,
                      provinceCode: value,
                      province: selectedProvince?.name || '',
                      districtCode: '',
                      district: '',
                      wardCode: '',
                      ward: '',
                    })
                    if (value) {
                      loadDistricts(parseInt(value))
                    }
                  }}
                  disabled={loadingProvinces}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={loadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành phố"} />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((province) => (
                      <SelectItem key={province.code} value={province.code.toString()}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="district" className="text-sm font-medium">Quận/Huyện *</Label>
                <Select
                  value={editFormData.districtCode || ''}
                  onValueChange={(value) => {
                    const selectedDistrict = districts.find(d => d.code.toString() === value)
                    setEditFormData({
                      ...editFormData,
                      districtCode: value,
                      district: selectedDistrict?.name || '',
                      wardCode: '',
                      ward: '',
                    })
                    if (value) {
                      loadWards(parseInt(value))
                    }
                  }}
                  disabled={loadingDistricts || !editFormData.provinceCode}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={loadingDistricts ? "Đang tải..." : "Chọn quận/huyện"} />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district.code} value={district.code.toString()}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ward" className="text-sm font-medium">Phường/Xã *</Label>
                <Select
                  value={editFormData.wardCode || ''}
                  onValueChange={(value) => {
                    const selectedWard = wards.find(w => w.code.toString() === value)
                    setEditFormData({
                      ...editFormData,
                      wardCode: value,
                      ward: selectedWard?.name || '',
                    })
                  }}
                  disabled={loadingWards || !editFormData.districtCode}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={loadingWards ? "Đang tải..." : "Chọn phường/xã"} />
                  </SelectTrigger>
                  <SelectContent>
                    {wards.map((ward) => (
                      <SelectItem key={ward.code} value={ward.code.toString()}>
                        {ward.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium">Website</Label>
              <Input
                id="website"
                value={editFormData.website || ''}
                onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                placeholder="https://example.com"
                className="h-10"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="avatar" className="text-sm font-medium">Logo/Avatar</Label>
              <div className="space-y-4">
                {/* Avatar Preview */}
                {(editFormData.avatarUrl || avatarPreview) && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                    <img
                      src={
                        avatarPreview || 
                        (editFormData.avatarUrl?.startsWith('http://') || editFormData.avatarUrl?.startsWith('https://')
                          ? editFormData.avatarUrl
                          : editFormData.avatarUrl?.startsWith('/uploads')
                          ? `${config.api.baseUrl.replace('/api', '')}${editFormData.avatarUrl}`
                          : editFormData.avatarUrl
                          ? `${config.api.baseUrl}${editFormData.avatarUrl}`
                          : '')
                      }
                      alt="Company logo"
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-logo.png'
                      }}
                    />
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarPreview('')
                          setAvatarFile(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="space-y-3">
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 h-10"
                    >
                      <Upload className="w-4 h-4" />
                      {avatarFile ? 'Chọn ảnh khác' : 'Tải ảnh lên'}
                    </Button>
                    {avatarFile && (
                      <span className="text-sm text-gray-600 flex items-center px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200">
                        {avatarFile.name}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">
                      Hoặc nhập URL: JPEG, PNG, GIF, WebP (tối đa 2MB)
                    </p>
                    {/* URL Input as fallback */}
                    <Input
                      id="avatarUrl"
                      value={editFormData.avatarUrl || ''}
                      onChange={(e) => {
                        setEditFormData({ ...editFormData, avatarUrl: e.target.value })
                        setAvatarPreview('')
                        setAvatarFile(null)
                      }}
                      placeholder="https://example.com/logo.png"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Giới Thiệu</Label>
              <Textarea
                id="description"
                value={editFormData.description || ''}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Mô tả về công ty của bạn..."
                rows={5}
                maxLength={2000}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                {(editFormData.description || '').length}/2000 ký tự
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setIsEditCompanyOpen(false)}
                disabled={isUpdatingCompany}
                className="h-10 px-6"
              >
                Hủy
              </Button>
              <Button
                onClick={handleUpdateCompany}
                disabled={isUpdatingCompany || !editFormData.name}
                className="h-10 px-6"
              >
                {isUpdatingCompany ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  'Cập nhật'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

