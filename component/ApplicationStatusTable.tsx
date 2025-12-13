"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  FileText, 
  Mail, 
  Phone, 
  Calendar, 
  Search, 
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  UserCheck,
  Filter,
  RefreshCw
} from "lucide-react"
import { Application } from "@/lib/api/applications"
import { useNotification } from "@/lib/notification-context"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface ApplicationStatusTableProps {
  applications: Application[]
  loading?: boolean
  onStatusChange: (applicationId: string, status: Application["status"]) => Promise<void>
  onRefresh?: () => void
}

// Simplified status options - ONLY 4 main statuses (submitted, interviewed, approved, rejected)
// This is the ONLY source of truth for status options in this component
const STATUS_OPTIONS = [
  { value: "applied" as const, label: "Đã nộp", color: "bg-blue-100 text-blue-800 border-blue-300", icon: Clock },
  { value: "interviewed" as const, label: "Đã phỏng vấn", color: "bg-orange-100 text-orange-800 border-orange-300", icon: UserCheck },
  { value: "hired" as const, label: "Đã duyệt", color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2 },
  { value: "rejected" as const, label: "Đã từ chối", color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
] as const

export function ApplicationStatusTable({
  applications,
  loading = false,
  onStatusChange,
  onRefresh,
}: ApplicationStatusTableProps) {
  const { showError } = useNotification()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  // Calculate statistics - only count the 4 main statuses
  const stats = useMemo(() => {
    const total = applications.length
    const byStatus = applications.reduce((acc, app) => {
      // Only count the 4 main statuses, map others
      let mappedStatus: Application["status"] = app.status
      if (app.status === "reviewing" || app.status === "shortlisted" || app.status === "applied") {
        mappedStatus = "applied"
      } else if (app.status === "interviewed") {
        mappedStatus = "interviewed"
      } else if (app.status === "hired") {
        mappedStatus = "hired"
      } else if (app.status === "rejected" || app.status === "withdrawn") {
        mappedStatus = "rejected"
      }
      acc[mappedStatus] = (acc[mappedStatus] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      applied: byStatus.applied || 0,
      interviewed: byStatus.interviewed || 0,
      hired: byStatus.hired || 0,
      rejected: byStatus.rejected || 0,
    }
  }, [applications])

  // Filter applications - only show the 4 main statuses
  const filteredApplications = useMemo(() => {
    let filtered = applications

    // Filter by status - map to 4 main statuses
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => {
        // Map all statuses to the 4 main ones
        let mappedStatus: Application["status"] = app.status
        if (app.status === "reviewing" || app.status === "shortlisted" || app.status === "applied") {
          mappedStatus = "applied"
        } else if (app.status === "interviewed") {
          mappedStatus = "interviewed"
        } else if (app.status === "hired") {
          mappedStatus = "hired"
        } else if (app.status === "rejected" || app.status === "withdrawn") {
          mappedStatus = "rejected"
        }
        return mappedStatus === statusFilter
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.user.fullName.toLowerCase().includes(query) ||
          app.user.email.toLowerCase().includes(query) ||
          app.user.phone?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [applications, statusFilter, searchQuery])

  const handleStatusUpdate = async (applicationId: string, newStatus: Application["status"]) => {
    setUpdatingStatus(applicationId)
    try {
      // Map simplified status to backend status if needed
      let backendStatus = newStatus
      // Backend accepts all statuses, so we can use directly
      await onStatusChange(applicationId, backendStatus)
    } catch (error: any) {
      showError("Lỗi", error.message || "Không thể cập nhật trạng thái")
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading && applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quản lý ứng viên</CardTitle>
          <CardDescription>Danh sách ứng viên đã ứng tuyển</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards - 4 main statuses */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Đã nộp</p>
                <p className="text-3xl font-bold text-blue-600">{stats.applied}</p>
              </div>
              <div className="rounded-full bg-blue-200 p-3">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Đã phỏng vấn</p>
                <p className="text-3xl font-bold text-orange-600">{stats.interviewed}</p>
              </div>
              <div className="rounded-full bg-orange-200 p-3">
                <UserCheck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Đã duyệt</p>
                <p className="text-3xl font-bold text-green-600">{stats.hired}</p>
              </div>
              <div className="rounded-full bg-green-200 p-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Đã từ chối</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="rounded-full bg-red-200 p-3">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Danh sách ứng viên</CardTitle>
              <CardDescription>
                {filteredApplications.length} / {applications.length} ứng viên
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                  className="gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                  Tải lại
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "Không tìm thấy ứng viên nào phù hợp"
                  : "Chưa có ứng viên nào ứng tuyển"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Ứng viên</TableHead>
                    <TableHead>Thông tin liên hệ</TableHead>
                    <TableHead>Loại đơn</TableHead>
                    <TableHead>Ngày nộp</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application, index) => {
                    // Map to one of the 4 main statuses for display
                    const displayStatus = (() => {
                      const status = application.status
                      if (status === "reviewing" || status === "shortlisted" || status === "applied") {
                        return "applied"
                      }
                      if (status === "interviewed") {
                        return "interviewed"
                      }
                      if (status === "hired") {
                        return "hired"
                      }
                      if (status === "rejected" || status === "withdrawn") {
                        return "rejected"
                      }
                      return "applied" // default
                    })()
                    const statusOption = STATUS_OPTIONS.find((opt) => opt.value === displayStatus)
                    const StatusIcon = statusOption?.icon || Clock

                    return (
                      <TableRow key={application._id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={application.user.avatar} alt={application.user.fullName} />
                              <AvatarFallback>{getInitials(application.user.fullName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{application.user.fullName}</p>
                              {application.formData?.phone && (
                                <p className="text-sm text-muted-foreground">
                                  {application.formData.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{application.user.email}</span>
                            </div>
                            {application.user.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{application.user.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={application.type === "cv" ? "default" : "secondary"}>
                            {application.type === "cv" ? "CV" : "Form"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {new Date(application.createdAt).toLocaleDateString("vi-VN")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={displayStatus}
                            onValueChange={(value) =>
                              handleStatusUpdate(application._id, value as Application["status"])
                            }
                            disabled={updatingStatus === application._id}
                          >
                            <SelectTrigger
                              className={cn(
                                "w-[150px] border-2 font-medium",
                                statusOption?.color,
                                updatingStatus === application._id && "opacity-50"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {statusOption && <StatusIcon className="w-4 h-4" />}
                                <SelectValue>
                                  {statusOption ? statusOption.label : displayStatus}
                                </SelectValue>
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((option) => {
                                const OptionIcon = option.icon
                                return (
                                  <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center gap-2">
                                      <OptionIcon className="w-4 h-4" />
                                      <span>{option.label}</span>
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {application.cvUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="gap-2"
                              >
                                <a
                                  href={application.cvUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span className="hidden sm:inline">Xem CV</span>
                                </a>
                              </Button>
                            )}
                            {application.cvUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="gap-2"
                              >
                                <a
                                  href={application.cvUrl}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

